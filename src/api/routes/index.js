"use strict";
const router = require("express").Router();
const verifyAuth = require("../middlewares/verifyAuth");

router.get("/status", (req, res, next) => {
  res.onlyMessage("Everything is OK");
});

// Routes
router.use("/", require("./auth.route"));
router.use("/users", verifyAuth, require("./user.route"));

module.exports = router;
