const User = require("../models").user;

//#region Get all users
/*
 *
 * @public GET /api/users
 */
exports.getAllUsers = async (req, res, next) => {
  let users = await User.findAll();
  res.respond({ count: users.length, users: users });
};
//#endregion
