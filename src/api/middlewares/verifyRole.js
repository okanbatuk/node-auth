"use strict;";

const httpStatus = require("http-status");

const verifyUser = (req, res, next) => {
  const { uuid, role } = req.user;

  uuid === req.params.uuid || role === "admin"
    ? next()
    : next({
        message: "You're not authorized",
        status: httpStatus.UNAUTHORIZED,
      });
};

const verifyAdmin = (req, res, next) => {
  const { role } = req.user;

  role === "admin"
    ? next()
    : next({
        message: "You don't have permission",
        status: httpStatus.FORBIDDEN,
      });
};

module.exports = { verifyAdmin, verifyUser };
