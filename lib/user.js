'use strict';

const db = require('./database');

const fns = {};

function _anything() {
    return 'nothing';
}

fns.login = (message, next) => {
    return db.getAllUsers(message)
        .then(data => {
            next(null, {doc: 'asd', processId: process.pid});
        }).catch(err => {
            return next({message: 'cmd was not test', code: 4000});
        });

};

fns.logout = (message, next) => {
    next(null, {
        doc: 'asd',
        processId: process.pid
    });
};

module.exports = fns;