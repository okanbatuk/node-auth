const authRoutes = require("express").Router();
const { validate } = require("express-validation");
const authController = require("../controllers/auth.controller");
const authValidations = require("../validations/auth.validations");

authRoutes
  .route("/register")
  .get((req, res, next) => {
    res.onlyMessage("You're in REGISTER Page");
  })
  .post(validate(authValidations.registration), authController.register);

authRoutes
  .route("/login")
  .get((req, res, next) => {
    res.onlyMessage("Hey there,you're in LOGIN Page");
  })
  .post(validate(authValidations.loggedIn), authController.login);

module.exports = authRoutes;
