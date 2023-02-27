const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");

const resHelper = require("../api/helper/response").helper();
const routes = require("../api/routes");
const errors = require("../api/middlewares/errors");
const { handler, converter, notFound } = errors;

/*
 * Create app
 * @public
 */
const app = express();

// Enable cors
app.use(cors());

// Request logging
app.use(morgan("dev"));

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
