const httpStatus = require("http-status");

const resHelper = (req, res, next = null) => {
  res.respond = (data = null, status = 200, message = "") => {
    res.statusCode = status;
    res.json(
      data === null
        ? { success: true, message: message }
        : { success: true, data: data }
    );
  };

  res.onlyMessage = (message) => {
    res.respond(null, httpStatus.OK, message);
  };

  res.respondNoContent = () => {
    res.respond(null, httpStatus.NO_CONTENT);
  };

  if (next !== null) next();
};

module.exports = {
  helper: () => resHelper,
};
