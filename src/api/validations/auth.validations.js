const Joi = require("joi");

module.exports = {
  registration: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(100).required(),
      firstName: Joi.string().min(3).max(40).required(),
      lastName: Joi.string().min(3).max(40).required(),
    }),
  },
  loggedIn: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(100).required(),
    }),
  },
};
