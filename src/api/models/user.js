"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    toJSON() {
      return { ...this.get(), id: undefined };
    }
  }
  User.init(
    {
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date(),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date(),
      },
    },
    {
      sequelize,
      modelName: "user",
      freezeTableName: true,
      timestamps: false,
    }
  );
  return User;
};
