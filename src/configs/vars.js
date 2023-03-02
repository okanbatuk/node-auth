const path = require("path");

// import env variables from .env file
require("dotenv-safe").config({
  allowEmptyValues: true,
  path: path.join(__dirname, "../../.env"),
});

module.exports = {
  port: process.env.PORT,
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  database: process.env.DB_DATABASE,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
};
