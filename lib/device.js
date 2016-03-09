'use strict';

const Joi = require('joi');

const db = require('./database');
const validation = require('./validation');

const util = require('./util');
const fns = {};

fns.unregisterDevice = (message, next) => {

    Joi.validate(message.data, validation.unregisterDevice, (err, device) => {

        if (err) {
            return util.validationError(err, 'unregister device service', next);
        }

        db.deactivateDevice(device.deviceId, next);
    });
};

fns.registerDevice = (message, next) => {

    Joi.validate(message.data, validation.registerDevice, (err, device) => {

        if (err) {
            return util.validationError(err, 'register device service', next);
        }

        if (device.user_id) {
            device.acitve = true;
        }

        let id = device.deviceId;

        db.upsertDevice(device)
            .then(() => {
                return next(null, {data: {deviceId: id}});
            })
            .catch(err => util.serviceError(err, 'register device service', next));
    });
};

module.exports = fns;
