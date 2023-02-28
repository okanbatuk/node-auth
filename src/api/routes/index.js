const express = require("express");
const authRoutes = require("./auth.route");
const userRoutes = require("./user.route");
const router = express.Router();

router.get("/status", (req, res, next) => {
  res.onlyMessage("Everything is OK");
});

// Auth Routes
router.use("/", authRoutes);

// User Ops Routes
router.use("/users", userRoutes);

module.exports = router;
