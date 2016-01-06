'use strict';

const Joi = require('joi');

const validations = {};

validations.mongoId = Joi.string().optional();
validations.mongoIdRequired = Joi.string().required();

let basicDataWithUserData = Joi.object().keys({
    user_id: validations.mongoIdRequired
});

module.exports = validations;