let whitelist = ["http://localhost:3000", "http://127.0.0.1:3000"];

module.exports.corsOpt = {
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};
