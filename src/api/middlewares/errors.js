const httpStatus = require("http-status");
const APIError = require("../helper/errors/APIError");

const handler = (error, req, res, next) => {
  const response = {
    success: false,
    status: error.status || httpStatus[error.status],
    message: error.message,
    errors: error.errors,
  };
  let status = response.status || httpStatus.INTERNAL_SERVER_ERROR;
  res.status(status).json(response);
};

exports.handler = handler;
/*
 * error is difference from APIError
 *
 */
exports.converter = (error, req, res, next) => {
  let convertedError = error;
  if (error.name == "ValidationError") {
    convertedError = new APIError({
      message: "ValidationError",
      errors: error.errors,
      status: error.statusCode || httpStatus.BAD_REQUEST,
    });
  } else if (!(error instanceof Error)) {
    convertedError = new APIError({
      message: error.message,
      status: error.status || httpStatus.BAD_REQUEST,
    });
  }
  return handler(convertedError, req, res, next);
};

exports.notFound = (req, res, next) => {
  const error = new APIError({
    message: "NOT FOUND",
    status: httpStatus.NOT_FOUND,
  });
  return handler(error, req, res, next);
};
