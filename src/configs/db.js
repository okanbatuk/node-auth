const dbConfig = require("../configs/vars");
let { host, username, database } = dbConfig;
require("dotenv-safe").config();
module.exports = {
  development: {
    username: username,
    password: null,
    database: database,
    host: host,
    dialect: "postgres",
    logging: false,
  },
  test: {
    username: "postgres",
    password: null,
    database: "testdb",
    host: "127.0.0.1",
    dialect: "postgres",
    logging: false,
  },
  production: {
    username: "postgres",
    password: null,
    database: "testdb",
    host: "127.0.0.1",
    dialect: "postgres",
    logging: false,
  },
};
