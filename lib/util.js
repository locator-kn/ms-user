'use strict';

const util = require('ms-utilities');
const log = util.logger;

const fns = {};

fns.validationError = (err, service, next) => {
    log.error(err, 'Validation failed of' + service);
    return next(err);
};

fns.serviceError = (err, service, next) => {
    log.error(err, service + ' failed');
    return next(err);
};

module.exports = fns;
