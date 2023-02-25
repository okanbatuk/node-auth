const express = require("express");
const httpStatus = require("http-status");

const router = express.Router();

router.get("/status", (req, res, next) => {
  res.status(httpStatus.OK).json({ message: "Everything is OK" });
});

module.exports = router;
