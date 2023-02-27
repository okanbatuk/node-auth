const express = require("express");
const authRoute = require("./auth.route");
const router = express.Router();

router.get("/status", (req, res, next) => {
  res.onlyMessage("Everything is OK");
});

router.use("/", authRoute);

module.exports = router;
