const express = require("express");
const morgan = require("morgan");
const routes = require("../api/routes");
/*
 * Create app
 * @public
 *
 */
const app = express();

// Request logging
app.use(morgan("dev"));

// parse body params to req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// create api routes
app.use("/api", routes);

// TODO: Errors will be managed

module.exports = app;
