const express = require("express");
const httpStatus = require("http-status");
// const resHelper = require("../api/helper/response").helper();
const router = express.Router();

router.route("/register").get((req, res, next) => {
  res.onlyMessage("You're in REGISTER Page");
});

router.route("/login").get((req, res, next) => {
  res.onlyMessage("Hey there,you're in LOGIN Page");
});

module.exports = router;
