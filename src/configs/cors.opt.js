const allowed = require("./cors.allowed");
const APIError = require("../api/helper/errors/APIError");

module.exports.corsOpt = {
  origin: (origin, callback) => {
    if (!origin || allowed.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new APIError("not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};
