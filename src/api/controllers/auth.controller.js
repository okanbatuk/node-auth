"use strict";

const httpStatus = require("http-status");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models").user;
const vars = require("../../configs/vars");
const tokenProvider = require("../utils/passport");

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
    let { email, password } = req.body;

    // Find user according to email and state of active
    let { count, rows } = await User.findAndCountAll({
      where: { email: email.toLowerCase(), isActive: true },
      limit: 1,
    });

    if (count > 0) {
      // Compare password with passwd of found user
      isMatch = await bcrypt.compare(password, rows[0].password);

      // TOKEN Generating
      let accessToken = undefined,
        refreshToken = undefined;

      isMatch &&
        (accessToken = await tokenProvider.generateAccessToken({
          email: rows[0].email,
        })),
        (refreshToken = await tokenProvider.generateRefreshToken({
          email: rows[0].email,
        }));

      accessToken && refreshToken && (rows[0].refreshToken = refreshToken);

      await rows[0].save();

      accessToken && refreshToken
        ? (res.cookie("jwt", refreshToken, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
          }),
          res.respond({ accessToken }))
        : next({
            message: "Email or password incorrect",
            status: httpStatus.UNAUTHORIZED,
          });
    } else {
      next({ message: "User Not Found", status: httpStatus.NOT_FOUND });
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

  // if cookies is exist check jwt in cookies
  if (!cookies || !cookies.jwt)
    return next({
      message: "Cookie was not provided",
      status: httpStatus.UNAUTHORIZED,
    });
  const refreshToken = cookies.jwt;

  // find user according to refresh token
  const { count, rows } = await User.findAndCountAll({
    where: { refreshToken },
    limit: 1,
  });

  count > 0 &&
    jwt.verify(
      refreshToken,
      vars.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err)
          return next({
            message: "Token was not recognized",
            status: httpStatus.UNAUTHORIZED,
          });
        if (rows[0].email !== decoded.email)
          return next({
            message: "UNAUTHORIZED",
            status: httpStatus.UNAUTHORIZED,
          });

        // generate access token
        let accessToken = await tokenProvider.generateAccessToken({
          email: rows[0].email,
        });
        accessToken && res.respond({ accessToken });
      }
    );
  count <= 0 &&
    next({ message: "User Not Found", status: httpStatus.NOT_FOUND });
};
//#endregion

//#region Logout Process
exports.logout = async (req, res, next) => {
  const cookies = req.cookies;

  // if cookies is exist check jwt in cookies
  if (!cookies || !cookies.jwt)
    return res.onlyMessage("No Content", httpStatus.NO_CONTENT);
  const refreshToken = cookies.jwt;

  // find users according to refresh token
  const { count, rows } = await User.findAndCountAll({
    where: { refreshToken },
    limit: 1,
  });

  // user not found
  count <= 0 &&
    (res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true }),
    res.onlyMessage("No Content", httpStatus.NO_CONTENT));

  // delete the user's refresh token if user is exists
  count > 0 &&
    ((rows[0].refreshToken = ""),
    await rows[0].save(),
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true }),
    res.onlyMessage("Logged out successfully", httpStatus.OK));
};
//#endregion
