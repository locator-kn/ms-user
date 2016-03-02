'use strict';

const Joi = require('joi');

const validations = {};

validations.mongoId = Joi.string().optional();
validations.mongoIdRequired = Joi.string().required();

let basicDataWithUserData = Joi.object().keys({
    user_id: validations.mongoIdRequired
});

validations.follow = basicDataWithUserData.keys({
    follow_id: validations.mongoIdRequired
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

validations.mail = Joi.object().keys({
    mail: Joi.string().email().min(3).max(60).required()
        .description('Mail address')
});

validations.login = Joi.object().keys({
    mail: Joi.string().email().min(3).max(60).required()
        .description('Mail address'),
    password: Joi.string().regex(/[a-zA-Z0-9@#$%_&!"§\/\(\)=\?\^]{3,30}/).required()
        .description('User set password'),
    requesting_device_id: Joi.string().required()
});

validations.fbLogin = Joi.object().keys({
    email: Joi.string().email().min(3).max(60).description('Mail address'),
    name: Joi.string().required().description('User name'),
    id: Joi.string().alphanum().required().description('Facebook user ID'),
    residence: Joi.string().description('User residence'),
    requesting_device_id: Joi.string().required()
});

validations.registerDevice = Joi.object().keys({
    deviceId: Joi.string().required(),
    type: Joi.string().required().valid(['ios', 'android']),
    version: Joi.string().required(),
    deviceModel: Joi.string().required(),
    pushToken: Joi.string().required(),
    manufacturer: Joi.string().required()
});

validations.unregisterDevice = Joi.object().keys({
    deviceId: Joi.string().required()
});

validations.addImage = Joi.object().keys({
    user_id: Joi.string().required(),
    images: Joi.object().keys({
        small: Joi.string().required(),
        normal: Joi.string().required()
    }).required()
});


validations.changePwd = Joi.object().keys({
    user_id: validations.mongoIdRequired,
    old_password: Joi.string().regex(/[a-zA-Z0-9@#$%_&!"§\/\(\)=\?\^]{3,30}/).required().description('enter old password'),
    new_password: Joi.string().regex(/[a-zA-Z0-9@#$%_&!"§\/\(\)=\?\^]{3,30}/).required().description('enter new password')
});
validations.getFollowing = basicDataWithUserData;

validations.getUser = basicDataWithUserData;


module.exports = validations;
