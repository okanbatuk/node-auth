"use strict";

const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

morgan.token("req-body", (req, res) => {
  return req.body || {};
});
morgan.token("date-time", () => {
  let now = new Date();
  return now.toLocaleString();
});
morgan.token("ip-address", (req, res) => {
  let ipAddress = getClientIp(req);
  return ipAddress;
});

var accessLogStream = fs.createWriteStream(
  path.join(__dirname, "../logs/log.json"),
  {
    flags: "a",
  }
);

function jsonFormat(tokens, req, res) {
  return JSON.stringify({
    "remote-address": tokens["ip-address"](req, res),
    time: tokens["date-time"](req, res),
    method: tokens["method"](req, res),
    url: tokens["url"](req, res),
    "req-body": tokens["req-body"](req, res),
    "res-status-code": tokens["status"](req, res),
  });
}

const getClientIp = (req) => {
  return req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0]
    : req.socket.remoteAddress.split(":")[3] ||
        req.connection.remoteAddress ||
        req.connection.socket.remoteAddress;
};

const logger = () => {
  return morgan(jsonFormat, { stream: accessLogStream });
};

module.exports = { logger };
