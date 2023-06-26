"use strict";

const httpStatus = require("http-status");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("../../configs/redis.con");

const User = require("../models").user;
const vars = require("../../configs/vars");
const tokenProvider = require("../utils/generateTokens");

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
    await checkEmail(email.toLowerCase());

    const hashedPassword = await bcrypt.hash(password, 10);

    // new user ll be created
    let newUser = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    res.onlyMessage(
      `New user ${newUser.firstName} ${newUser.lastName} is created..`,
      httpStatus.CREATED
    );
  } catch (error) {
    next(error);
  }
};

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
    const user = await findUserByEmail(email.toLowerCase());

    // Compare password with passwd of found user
    await comparePassword(password, user.password);

    // TOKEN Generating
    let newAccessToken = await tokenProvider.generateAccessToken({
      uuid: user.uuid,
      role: user.role,
    });
    let newRefreshToken = await tokenProvider.generateRefreshToken({
      uuid: user.uuid,
      role: user.role,
    });

    // Add new refresh token to redis cache memory
    await redisClient
      .multi()
      .sAdd(user.uuid, newRefreshToken)
      .expire(user.uuid, 24 * 60 * 60)
      .exec();

    /*
     *
     * if cookie doesnt exist, there is no problem.
     *    Give the new refresh token and go.
     *
     * if cookies and cookies jwt exist, there is an old refresh token
     *    Delete the old token and go
     */
    cookies?.jwt &&
      (res.clearCookie("jwt", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      }),
      await redisClient.sRem(user.uuid, cookies.jwt));

    // add refresh token to cookie
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.respond({ user, accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

/*
 *
 * @public GET /api/refresh/:uuid
 */
exports.regenerateToken = async (req, res, next) => {
  try {
    const cookies = req.cookies;

    // if cookies is exist check jwt in cookies
    if (!cookies || !cookies.jwt)
      return next({
        message: "Cookie was not provided",
        status: httpStatus.UNAUTHORIZED,
      });

    const refreshToken = cookies.jwt;

    // delete token to be used
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    // find user according to refresh token
    jwt.verify(
      refreshToken,
      vars.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        // the token is expired
        if (err) {
          return next({
            message: "Token is expired",
            status: httpStatus.UNAUTHORIZED,
          });
        }
        // remove the used token
        await redisClient.sRem(decoded.uuid, refreshToken);

        const user = await findUserById(decoded.uuid);

        // Refresh token is still valid so generate access token
        let newAccessToken = await tokenProvider.generateAccessToken({
          uuid: decoded.uuid,
          role: decoded.role,
        });

        // create new refresh token because current token was used
        let newRefreshToken = await tokenProvider.generateRefreshToken({
          uuid: decoded.uuid,
          role: decoded.role,
        });

        // add new refresh token next to other tokens
        await redisClient
          .multi()
          .sAdd(decoded.uuid, newRefreshToken)
          .expire(decoded.uuid, 24 * 60 * 60)
          .exec();

        // set new refresh token to jwt cookie
        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });
        res.respond({ user, accessToken: newAccessToken });
      }
    );
  } catch (err) {
    next(err);
  }
};

/*
 *
 * @public GET /api/logout
 */
exports.logout = async (req, res, next) => {
  try {
    const cookies = req.cookies;

    // if cookies is exist check jwt in cookies
    if (!cookies || !cookies.jwt)
      return res.onlyMessage("No Content", httpStatus.NO_CONTENT);

    const refreshToken = cookies.jwt;

    // delete the token
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    // find users according to refresh token
    jwt.verify(
      refreshToken,
      vars.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err)
          return next({ message: "No Content", status: httpStatus.NO_CONTENT });

        // tokens of found user should be deleted
        let count = await redisClient.sCard(decoded.uuid);

        count > 1
          ? await redisClient.sRem(decoded.uuid, refreshToken)
          : await redisClient.del(decoded.uuid);

        res.onlyMessage("Logged out successfully", httpStatus.OK);
      }
    );
  } catch (err) {
    next(err);
  }
};

// find user according to sent email
const checkEmail = async (email) => {
  let { count } = await User.findAndCountAll({
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

// check user according to sent uuid
const findUserById = async (uuid) => {
  let { count, rows } = await User.findAndCountAll({
    where: { uuid, isActive: true },
    limit: 1,
  });

  return new Promise((resolve, reject) => {
    count > 0
      ? resolve(rows[0])
      : reject({ message: "User Not Found", status: httpStatus.NOT_FOUND });
  });
};

// check user according to sent email
const findUserByEmail = async (email) => {
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
