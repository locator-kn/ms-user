'use strict';

const Joi = require('joi');

const validations = {};

validations.mongoId = Joi.string().optional();
validations.mongoIdRequired = Joi.string().required();

let basicDataWithUserData = Joi.object().keys({
    user_id: validations.mongoIdRequired
});

validations.follow = basicDataWithUserData.keys({
    to_follow: validations.mongoIdRequired
});

validations.register = Joi.object().keys({
    mail: Joi.string().email().min(3).max(60).required()
        .description('Mail address'),
    password: Joi.string().regex(/[a-zA-Z0-9@#$%_&!"§\/\(\)=\?\^]{3,30}/).required()
        .description('User set password'),
    name: Joi.string().required().description('User name'),
    residence: Joi.string().required().description('User residence'),
    requesting_device_id: Joi.string().required()
});

validations.registerDevice = Joi.object().keys({
    deviceId: Joi.string().required(),
    type: Joi.string().required().valid(['ios', 'android']),
    version: Joi.string().required(),
    deviceModel: Joi.string().required()
});


module.exports = validations;
