'use strict';

const Joi = require('joi');

const db = require('./database');
const validation = require('./validation');

const util = require('./util');

module.exports = {
    getDevice,
    unregisterDevice,
    registerDevice,
    getPushToken
};

function getDevice(message, next) {

    Joi.validate(message.data, validation.idArray, (err, ids) => {

        if (err) {
            return util.validationError(err, 'get devices service', next)
        }

        db.findGenericById(ids, 'devices')
            .then(devices => next(null, {data: devices}))
            .catch(next);

    })
}

function unregisterDevice(message, next) {

    Joi.validate(message.data, validation.unregisterDevice, (err, device) => {

        if (err) {
            return util.validationError(err, 'unregister device service', next);
        }

        db.deactivateDevice(device.deviceId, next);
    });
}

function registerDevice(message, next) {

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
}

function getPushToken(message, next) {

    Joi.validate(message.data, validation.idArray, (err, data) => {

        if (err) {
            return util.validationError(err, 'get push token service', next);
        }


        db.getPushTokenFromUser(data.user_ids)
            .then(tokens => next(null, {data: tokens}))
            .catch(err => util.serviceError(err, 'get push token service', next));

    });
}
