const Joi = require("joi");

module.exports = {
  paramsVal: {
    params: Joi.object({
      uuid: Joi.string().guid(),
    }),
  },
  updateInfo: {
    body: Joi.object({
      email: Joi.string().email().max(50),
      firstName: Joi.string().min(3).max(40),
      lastName: Joi.string().min(3).max(40),
    }),
  },
  updatePasswd: {
    body: Joi.object({
      password: Joi.string().min(6).max(100).required(),
      newPassword: Joi.string().min(6).max(100).required(),
    }),
  },
};
