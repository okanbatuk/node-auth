"use strict;";

const httpStatus = require("http-status");

const verifyUser = (req, res, next) => {
  const { uuid, roles } = req.user;

  uuid === req.params.uuid || roles === "admin"
    ? next()
    : next({
        message: "You're not authorized",
        status: httpStatus.UNAUTHORIZED,
      });
};

const verifyAdmin = (req, res, next) => {
  const { roles } = req.user;

  roles === "admin"
    ? next()
    : next({
        message: "You don't have permission",
        status: httpStatus.FORBIDDEN,
      });
};

module.exports = { verifyAdmin, verifyUser };
