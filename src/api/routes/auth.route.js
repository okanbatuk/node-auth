"use strict";

const authRoutes = require("express").Router();
const { validate } = require("express-validation");
const authController = require("../controllers/auth.controller");
const authValidations = require("../utils/auth.validations");

//#region /api/register route
authRoutes
  .route("/register")
  .get((req, res, next) => {
    /*
     * this is a response handler in helper folder
     * onlyMessage returns
     *  {
     *    success: true,
     *    message: "You're in REGISTER Page"
     *  }
     *
     * @public GET /api/register
     */
    res.onlyMessage("You're in REGISTER Page");
  })
  .post(validate(authValidations.registration), authController.register);
//#endregion

//#region /api/login route
authRoutes
  .route("/login")
  .get((req, res, next) => {
    /*
     * this is a response handler in helper folder
     * onlyMessage returns
     *  {
     *    success: true,
     *    message: "Hey there,you're in LOGIN Page"
     *  }
     *
     * @public GET /api/login
     */
    res.onlyMessage("Hey there,you're in LOGIN Page");
  })
  .post(validate(authValidations.loggedIn), authController.login);
//#endregion

//#region /api/refresh route
/*
 *
 * Geneate Access Token according to refresh token in cookies
 */
authRoutes.route("/refresh").get(authController.regenerateToken);
//#endregion

//#region /api/logout
/*
 *
 * Clear jwt cookie and delete refresh token
 */
authRoutes.route("/logout").get(authController.logout);
//#endregion

module.exports = authRoutes;
