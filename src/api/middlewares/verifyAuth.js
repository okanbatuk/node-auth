"use strict";
const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const vars = require("../../configs/vars");

/*
 * This middleware is used to check jwt when user is logged in
 * @private
 */
module.exports = (req, res, next) => {
  // if authorization does not exist variable ll be null
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  // verify the token
  token
    ? jwt.verify(token, vars.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err)
          return next({ message: err.message, status: httpStatus.FORBIDDEN }); //invalid token
        req.user = decoded.email;
        next();
      })
    : next({
        message: "Token was not provided",
        status: httpStatus.BAD_REQUEST,
      });
};
