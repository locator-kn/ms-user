'use strict';

const Joi = require('joi');

const db = require('./database');
const validation = require('./validation');

const util = require('ms-utilities');
const log = util.logger;

const fns = {};

fns.unregisterDevice = (message, next) => {

    Joi.validate(message.data, validation.unregisterDevice, (err, device) => {

        if (err) {
            log.error(err, 'Validation failed of unregister device service');
            return next(err);
        }

        db.deactivateDevice(device.deviceId, next);
    });
};

fns.registerDevice = (message, next) => {

    Joi.validate(message.data, validation.registerDevice, (err, device) => {

        if (err) {
            log.error(err, 'Validation failed of register device service');
            return next(err);
        }

        db.upsertDevice(message.data)
            .then(() => {

                return next(null, {data: {deviceId: device.deviceId}});
            })
            .catch(err => {
                log.error(err, 'Error in register device service');
                return next(err);
            });
    });
};

module.exports = fns;
