"use strict";

const httpStatus = require("http-status");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models").user;
const vars = require("../../configs/vars");
const tokenProvider = require("../utils/generateTokens");

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
    let cryptedPassword = await bcrypt.hash(password, 10);

    // Check the email in db
    let { count } = await User.findAndCountAll({
      where: {
        email: email.toLowerCase(),
      },
      limit: 2,
    });

    // if count is Zero new user ll be created
    let newUser =
      count === 0 &&
      (await User.create({
        firstName: firstName,
        lastName: lastName,
        email: email.toLowerCase(),
        password: cryptedPassword,
      }));

    count === 0
      ? res.onlyMessage(
          `New user ${newUser.firstName} ${newUser.lastName} is created..`,
          httpStatus.CREATED
        )
      : next({
          message: "This email has already been used",
          status: httpStatus.CONFLICT,
        });
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
    let isMatch = false;
    let cookies = req.cookies;
    let { email, password } = req.body;
    let user = {};
    let newAccessToken = undefined;
    let newRefreshToken = undefined;
    let newRefreshTokenArray = [];

    // Find user according to email and state of active
    let { count, rows } = await User.findAndCountAll({
      where: { email: email.toLowerCase(), isActive: true },
      limit: 1,
    });

    count <= 0 &&
      next({ message: "User Not Found", status: httpStatus.NOT_FOUND });

    if (count > 0) {
      user = rows[0];

      // Compare password with passwd of found user
      isMatch = await bcrypt.compare(password, user.password);

      // TOKEN Generating
      if (isMatch) {
        newAccessToken = await tokenProvider.generateAccessToken({
          email: user.email,
        });
        newRefreshToken = await tokenProvider.generateRefreshToken({
          email: user.email,
        });
      }

      /*
       * if tokens are generated successfully
       *
       * check cookies
       *
       * if cookies is not exist, there is no problem.
       *    Give the new refresh token and go.
       * if cookies and cookies jwt is exist, there is an old refresh token
       *    Delete the old token and go
       */
      newAccessToken &&
        newRefreshToken &&
        (newRefreshTokenArray = !cookies?.jwt
          ? user.refreshToken
          : user.refreshToken &&
            user.refreshToken.filter((token) => token !== cookies.jwt));

      cookies?.jwt &&
        res.clearCookie("jwt", {
          httpOnly: true,
          // sameSite: "None",
          // secure: true,
        });

      user.refreshToken = newRefreshTokenArray
        ? [...newRefreshTokenArray, newRefreshToken]
        : [newRefreshToken];
      await user.save();

      if (newAccessToken && newRefreshToken) {
        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          // sameSite: "None",
          // secure: true,
          maxAge: 24 * 60 * 60 * 1000,
        }),
          res.respond({ accessToken: newAccessToken });
      } else {
        next({
          message: "Email or password incorrect",
          status: httpStatus.UNAUTHORIZED,
        });
      }
    }
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
  let user = {};
  let newAccessToken = undefined;
  let newRefreshToken = undefined;
  let newRefreshTokenArray = [];

  // if cookies is exist check jwt in cookies
  if (!cookies || !cookies.jwt)
    return next({
      message: "Cookie was not provided",
      status: httpStatus.UNAUTHORIZED,
    });
  const refreshToken = [cookies.jwt];

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
        user.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        await user.save();

        // set new refresh token to jwt cookie
        newAccessToken && newRefreshToken
          ? (res.cookie("jwt", newRefreshToken, {
              httpOnly: true,
              // secure: true,
              // sameSite: "None",
            }),
            res.respond({ newAccessToken }))
          : next({
              message: "Generation of Tokens failed",
              status: httpStatus.INTERNAL_SERVER_ERROR,
            });
      }
    );
  }

  // Detected refresh token reuse !!!
  // token is invalid or expired
  count <= 0 &&
    (jwt.verify(
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
    ),
    next({ message: "FORBIDDEN", status: httpStatus.FORBIDDEN }));
};
//#endregion

//#region Logout Process
exports.logout = async (req, res, next) => {
  const cookies = req.cookies;

  // if cookies is exist check jwt in cookies
  if (!cookies || !cookies.jwt)
    return res.onlyMessage("No Content", httpStatus.NO_CONTENT);
  const refreshToken = [cookies.jwt];

  // find users according to refresh token
  const { count, rows } = await User.findAndCountAll({
    where: { refreshToken },
    limit: 1,
  });

  // delete the user's refresh token if user is exists
  if (count > 0) {
    let user = rows[0];
    user.refreshToken = user.refreshToken.filter((t) => t !== refreshToken[0]);
    await user.save();
    res.clearCookie("jwt", {
      httpOnly: true,
      // sameSite: "None",
      // secure: true,
    });
    res.onlyMessage("Logged out successfully", httpStatus.OK);
  }

  // user not found
  // TODO: check the user not found section
  count <= 0 &&
    (res.clearCookie("jwt", {
      httpOnly: true /* sameSite: "None", secure: true  */,
    }),
    res.onlyMessage("No Content", httpStatus.NO_CONTENT));
};
//#endregion
