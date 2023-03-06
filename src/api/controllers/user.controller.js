"use strict";
const httpStatus = require("http-status");
const bcrypt = require("bcrypt");
const User = require("../models").user;

let user = null;
let users = [];

/*
 * Get all users
 *
 * @public GET /api/users
 */
exports.getAllUsers = async (req, res, next) => {
  users = await User.findAll();
  res.respond({ count: users.length, users: users });
};

/*
 * Get user informations by uuid
 *
 * @public GET /api/users/:uuid
 */
exports.getUserByUuid = async (req, res, next) => {
  try {
    let { uuid } = req.params;
    user = await findUserByUuid(uuid);

    user && res.respond({ users: [user] });
  } catch (error) {
    next(error);
  }
};

/*
 * Update User's Informations
 *
 * @body {String} email
 * @body {String} firstName
 * @body {String} lastName
 *
 * @public POST /api/users/:uuid
 */
exports.updateInfo = async (req, res, next) => {
  try {
    let { uuid } = req.params;
    let { email, firstName, lastName } = req.body;
    let conflictUser = undefined;

    // if user not found in db, function throws a reject message as user NOT FOUND
    user = await findUserByUuid(uuid);

    /*
     *
     * if there is an email field function checks the db.
     * there is a conflict user function throws a reject message as CONFLICT
     * */
    email && (conflictUser = await findUserByEmail(email));

    // if there are fields for email or firstName or lastName, update them
    email && (user.email = email);
    firstName && (user.firstName = firstName);
    lastName && (user.lastName = lastName);

    // if there is a update operation throws a resolve message as updated
    email || firstName || lastName
      ? (await user.save(), res.onlyMessage("User successfully updated"))
      : next({
          message: "Nothing has been changed",
          status: httpStatus.BAD_REQUEST,
        });
  } catch (error) {
    // if there is a reject message, this'll catch it
    next(error);
  }
};

/*
 * Update User's Password
 *
 * @body {String} password
 * @body {String} newPassword
 *
 * @public /api/users/:uuid
 */
exports.updatePassword = async (req, res, next) => {
  try {
    let { uuid } = req.params;
    let { password, newPassword } = req.body;

    user = await findUserByUuid(uuid);
    await checkPassword(password, user.password);

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.onlyMessage("User password successfully updated");
  } catch (error) {
    next(error);
  }
};

/*
 * Delete user
 *
 * @public /api/users/:uuid
 */
exports.deleteUser = async (req, res, next) => {
  try {
    let { uuid } = req.params;

    user = await findUserByUuid(uuid);
    user.isActive = false;
    await user.save();

    res.onlyMessage("User successfully deleted");
  } catch (error) {
    next(error);
  }
};

// find user according to sent uuid
const findUserByUuid = async (uuid) => {
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

// find user according to sent uuid
const findUserByEmail = async (email) => {
  let { count, rows } = await User.findAndCountAll({
    where: { email, isActive: true },
    limit: 1,
  });

  return new Promise((resolve, reject) => {
    count === 0
      ? resolve(undefined)
      : reject({
          message: "Email has already been used",
          status: httpStatus.CONFLICT,
        });
  });
};

const checkPassword = async (password, userPassword) => {
  let check = await bcrypt.compare(password, userPassword);

  return new Promise((resolve, reject) => {
    check
      ? resolve(true)
      : reject({
          message: "Password was not matched",
          status: httpStatus.FORBIDDEN,
        });
  });
};
