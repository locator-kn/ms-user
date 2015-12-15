'use strict';

const db = require('./database');

const fns = {};

/**
 * Returns nothing, nothing
 * @returns {string} - nothing
 * @private
 */
function _anything() {
    return 'nothing';
}

/**
 * This function does something, sometimes
 * @param message - some data from outside
 * @param next - callback function - to be called in node-style: (err, message)
 * @returns {Promise.<T>}
 */
fns.login = (message, next) => {
    return db.getAllUsers(message)
        .then(data => {
            next(null, {doc: 'asd', processId: process.pid});
        }).catch(err => {
            return next({message: 'cmd was not test', code: 4000});
        });

};

/**
 * This function does something else
 * @param message - some data
 * @param next - callback
 */
fns.logout = (message, next) => {
    next(null, {
        doc: 'asd',
        processId: process.pid
    });
};

module.exports = fns;