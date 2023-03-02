const httpStatus = require("http-status");

const resHelper = (req, res, next = null) => {
  res.respond = (data = null, status = httpStatus.OK, message = "") => {
    res.statusCode = status;
    res.json(
      data === null
        ? { success: true, message: message }
        : { success: true, data: data }
    );
  };

  res.onlyMessage = (message, status = httpStatus.OK) => {
    res.respond(null, status, message);
  };

  res.respondNoContent = () => {
    res.respond(null, httpStatus.NO_CONTENT);
  };

  if (next !== null) next();
};

module.exports = {
  helper: () => resHelper,
};
