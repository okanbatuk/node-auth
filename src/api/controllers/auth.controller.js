"use strict";

const httpStatus = require("http-status");
const bcrypt = require("bcrypt");
const User = require("../models").user;

exports.register = async (req, res, next) => {
  try {
    let { email, password, firstName, lastName } = req.body;
    let cryptedPassword = await bcrypt.hash(password, 10);
    let { count, rows } = await User.findAndCountAll({
      where: {
        email: email.toLowerCase(),
      },
      limit: 2,
    });
    if (count === 0) {
      let newUser = await User.create({
        firstName: firstName,
        lastName: lastName,
        email: email.toLowerCase(),
        password: cryptedPassword,
      });
      res.respond(newUser, httpStatus.CREATED);
    } else {
      next({
        message: "This email has already been used",
        status: httpStatus.CONFLICT,
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    let isMatch = false;
    let { email, password } = req.body;
    let { count, rows } = await User.findAndCountAll({
      where: { email: email.toLowerCase() },
      limit: 1,
    });
    if (count > 0) {
      isMatch = await bcrypt.compare(password, rows[0].password);

      isMatch
        ? res.respond(rows[0])
        : next({
            message: "Fail",
            status: httpStatus.UNAUTHORIZED,
          });
    } else {
      next({ message: "User Not Found", status: httpStatus.NOT_FOUND });
    }
  } catch (error) {
    next(error);
  }
};
