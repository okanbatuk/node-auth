const allowedOrigins = require("../../configs/cors.allowed");

exports.credentials = (req, res, next) => {
  const origin = req.headers.origin;

  allowedOrigins.includes(origin) &&
    res.header("Access-Control-Allow-Credentials", true);
  next();
};
