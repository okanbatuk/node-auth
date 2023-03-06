"use strict";

const httpStatus = require("http-status");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models").user;
const vars = require("../../configs/vars");
const tokenProvider = require("../utils/generateTokens");

let user = {};
let newRefreshTokenArray = [];
let newAccessToken = undefined;
let newRefreshToken = undefined;

//#region Registration
/*
 *
 * @body
 *  {
 *    email: string
 *    password: string
 *    firstName: string
 *    lastName: string
 *  }
 *
 * @public POST /api/register
 */

exports.register = async (req, res, next) => {
  try {
    let { email, password, firstName, lastName } = req.body;

    // Check the email in db
    await findUserByEmail(email.toLowerCase());

    // new user ll be created
    let newUser = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
    });

    res.onlyMessage(
      `New user ${newUser.firstName} ${newUser.lastName} is created..`,
      httpStatus.CREATED
    );
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region Login section
/*
 *
 * @body
 *  {
 *    email:string
 *    password:string
 *  }
 *
 * @public POST /api/login
 *
 */
exports.login = async (req, res, next) => {
  try {
    let cookies = req.cookies;
    let { email, password } = req.body;

    // Find user according to email and state of active
    user = await checkUserByEmail(email.toLowerCase());

    // Compare password with passwd of found user
    await comparePassword(password, user.password);

    // TOKEN Generating
    newAccessToken = await tokenProvider.generateAccessToken({
      email: user.email,
    });
    newRefreshToken = await tokenProvider.generateRefreshToken({
      email: user.email,
    });

    /*
     *
     * if cookies is not exist, there is no problem.
     *    Give the new refresh token and go.
     *
     * if cookies and cookies jwt is exist, there is an old refresh token
     *    Delete the old token and go
     */
    newRefreshTokenArray = !cookies?.jwt
      ? user.refreshToken
      : user.refreshToken &&
        user.refreshToken.filter((token) => token !== cookies.jwt);

    // if cookie is exist, delete the old token
    cookies?.jwt &&
      res.clearCookie("jwt", {
        httpOnly: true,
        // sameSite: "None",
        // secure: true,
      });

    // add new refresh token to db
    user.refreshToken = newRefreshTokenArray
      ? [...newRefreshTokenArray, newRefreshToken]
      : [newRefreshToken];
    await user.save();

    // add refresh token to cookie
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      // sameSite: "None",
      // secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.respond({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region Geneate Access Token according to refresh token in cookies
/*
 *
 * @public GET /api/refresh
 */
exports.regenerateToken = async (req, res, next) => {
  const cookies = req.cookies;

  // if cookies is exist check jwt in cookies
  if (!cookies || !cookies.jwt)
    return next({
      message: "Cookie was not provided",
      status: httpStatus.UNAUTHORIZED,
    });

  const refreshToken = [cookies.jwt];

  // delete token to be used
  res.clearCookie("jwt", {
    httpOnly: true /* sameSite: "None", secure: true */,
  });

  // find user according to refresh token
  const { count, rows } = await User.findAndCountAll({
    where: { refreshToken },
    limit: 1,
  });

  if (count > 0) {
    user = rows[0];
    newRefreshTokenArray = user.refreshToken.filter(
      (t) => t !== refreshToken[0]
    );

    jwt.verify(
      refreshToken[0],
      vars.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          // the token is exist in db but its expired
          user.refreshToken = [...newRefreshTokenArray];
          await user.save();
          return next({
            message: "Token is expired",
            status: httpStatus.UNAUTHORIZED,
          });
        }
        if (user.email !== decoded.email)
          return next({
            message: "UNAUTHORIZED",
            status: httpStatus.UNAUTHORIZED,
          });

        // Refresh token is still valid so generate access token
        newAccessToken = await tokenProvider.generateAccessToken({
          email: user.email,
        });

        // create new refresh token because current token was used
        newRefreshToken = await tokenProvider.generateRefreshToken({
          email: user.email,
        });

        // add new refresh token next to other tokens
        user.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        await user.save();

        // set new refresh token to jwt cookie
        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          // secure: true,
          // sameSite: "None",
        });
        res.respond({ accessToken: newAccessToken });
      }
    );
  } else {
    // Detected refresh token reuse !!!
    // token is invalid or expired
    jwt.verify(
      refreshToken[0],
      vars.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err)
          return next({
            message: "Something went wrong",
            status: httpStatus.FORBIDDEN,
          });
        let hackedUser = await User.findOne({
          where: { email: decoded.email },
        });
        hackedUser.refreshToken = [];
        await hackedUser.save();
      }
    );
    next({ message: "FORBIDDEN", status: httpStatus.FORBIDDEN });
  }
};
//#endregion

//#region Logout Process
exports.logout = async (req, res, next) => {
  const cookies = req.cookies;

  // if cookies is exist check jwt in cookies
  if (!cookies || !cookies.jwt)
    return res.onlyMessage("No Content", httpStatus.NO_CONTENT);
  const refreshToken = [cookies.jwt];

  // delete the token
  res.clearCookie("jwt", {
    httpOnly: true /* sameSite: "None", secure: true  */,
  });

  // find users according to refresh token
  const { count, rows } = await User.findAndCountAll({
    where: { refreshToken },
    limit: 1,
  });

  // delete the user's refresh token if user is exists
  count > 0 &&
    ((user = rows[0]),
    (user.refreshToken = user.refreshToken.filter(
      (t) => t !== refreshToken[0]
    )),
    await user.save(),
    res.onlyMessage("Logged out successfully", httpStatus.OK));

  // user not found
  count <= 0 && res.onlyMessage("No Content", httpStatus.NO_CONTENT);
};
//#endregion

// find user according to sent email
const findUserByEmail = async (email) => {
  let { count, rows } = await User.findAndCountAll({
    where: { email },
    limit: 1,
  });

  return new Promise((resolve, reject) => {
    count === 0
      ? resolve(undefined)
      : reject({
          message: "This email has already been used",
          status: httpStatus.CONFLICT,
        });
  });
};

// check user according to sent email
const checkUserByEmail = async (email) => {
  let { count, rows } = await User.findAndCountAll({
    where: { email: email, isActive: true },
    limit: 1,
  });

  return new Promise((resolve, reject) => {
    count > 0
      ? resolve(rows[0])
      : reject({ message: "User Not Found", status: httpStatus.NOT_FOUND });
  });
};

// compare sent password and user password
const comparePassword = async (password, userPassword) => {
  let check = await bcrypt.compare(password, userPassword);

  return new Promise((resolve, reject) => {
    check
      ? resolve(check)
      : reject({
          message: "Email or password incorrect",
          status: httpStatus.UNAUTHORIZED,
        });
  });
};
