"use strict";
const userRoutes = require("express").Router();
const { validate } = require("express-validation");
const userController = require("../controllers/user.controller");
const userValidations = require("../utils/user.validations");

userRoutes.route("/").get(userController.getAllUsers);

userRoutes
  .route("/:uuid")
  .get(validate(userValidations.paramsVal), userController.getUserByUuid)
  .post(
    validate(userValidations.paramsVal),
    validate(userValidations.updateInfo),
    userController.updateInfo
  )
  .delete(validate(userValidations.paramsVal), userController.deleteUser);

userRoutes.post(
  "/update-password/:uuid",
  validate(userValidations.paramsVal),
  validate(userValidations.updatePasswd),
  userController.updatePassword
);

module.exports = userRoutes;
