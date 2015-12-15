'use strict';

const db = require('./database');

const fns = {};


fns.login = (message, next) => {
    return db.getUser(message.data.mail)
        .then(user => {
            if(user.password == message.data.password) {
                next(null, {loggedIn: "true"});
            } else {
                next(null, {loggedIn: "false"});
            }
        }).catch(err => {
            return next(err);
        });

};

fns.logout = (message, next) => {
    next(null, {msg: "not implemented"});
};


fns.register = (message, next) => {
    var user = message.data;
    return db.createUser(user)
        .then(result => {
            next(null, {});
        })
        .catch(err => {
            next(err);
        });
}

module.exports = fns;