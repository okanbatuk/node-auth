const { sequelize } = require("../api/models");

const connectDB = async () => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    console.log(error);
  }
};

module.exports = connectDB;
