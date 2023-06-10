"use strict";
const userRoutes = require("express").Router();
const { validate } = require("express-validation");
const userController = require("../controllers/user.controller");
const userValidations = require("../utils/user.validations");
const { verifyAdmin, verifyUser } = require("../middlewares/verifyRole");

userRoutes.route("/").get(verifyAdmin, userController.getAllUsers);

userRoutes
  .route("/:uuid")
  .all(validate(userValidations.paramsVal), verifyUser)
  .get(userController.getUserByUuid)
  .post(validate(userValidations.updateInfo), userController.updateInfo)
  .delete(userController.deleteUser);

userRoutes.post(
  "/update-password/:uuid",
  validate(userValidations.paramsVal),
  verifyUser,
  validate(userValidations.updatePasswd),
  userController.updatePassword
);

module.exports = userRoutes;
