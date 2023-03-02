const allowed = require("../../configs/cors.allowed");

exports.credentials = (req, res, next) => {
  const origin = req.headers.origin;

  allowed.includes(origin) &&
    res.header("Access-Control-Allow-Credentials", true);
  next();
};
