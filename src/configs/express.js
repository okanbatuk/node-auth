const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");

const resHelper = require("../api/helper/response").helper();
const routes = require("../api/routes");
const errors = require("../api/middlewares/errors");
const { corsOpt } = require("./cors.opt");
const logger = require("../api/middlewares/logging").logger();
const { handler, converter, notFound } = errors;

/*
 * Create app
 * @public
 */
const app = express();

// Request logging
app.use(logger);

// Enable Cross Origin Resource Sharing
app.use(cors(corsOpt));

// parse body params to req.body
app.use(bodyParser.json());

// response handler
app.use(resHelper);

// routes
app.use("/api", routes);

// catch 404 and forward to error handler
app.use(notFound);

// if error is not an instanceof APIError
app.use(converter);

// error handler will be called
app.use(handler);

module.exports = app;
