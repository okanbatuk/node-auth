"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.createTable("user", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      firstName: {
        type: DataTypes.STRING(40),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(40),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(20),
        defaultValue: "user",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    });
  },
  async down(queryInterface, DataTypes) {
    await queryInterface.dropAllTables();
  },
};
