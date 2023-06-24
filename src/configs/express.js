const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const routes = require("../api/routes");
const errors = require("../api/middlewares/errors");
const logger = require("../api/middlewares/logging").logger();
const resHelper = require("../api/helper/response").helper();
const { corsOpt } = require("./cors.opt");
const { credentials } = require("../api/middlewares/credentials");
const { headerOpt } = require("../api/middlewares/headerOpt");

const { handler, converter, notFound } = errors;

/*
 * Create app
 * @public
 */
const app = express();

// Request logging
app.use(logger);

// fetch cookies credentials
app.use(credentials);

// Enable Cross Origin Resource Sharing
app.use(cors(corsOpt));

// allow the app to use cookieparser
app.use(helmet());

// parse cookie
app.use(cookieParser());

// parse body params to req.body
app.use(bodyParser.json());

// Enable to use credentials
app.use(headerOpt);

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
