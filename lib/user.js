'use strict';

const db = require('./database');

const fns = {};

const bcrypt = require('bcrypt');

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

function generatePasswordToken(password) {
    return new Promise((resolve, reject) => {

        bcrypt.genSalt(10, (err, salt) => {

            if (err) {
                return reject(err);
            }
            this.bcrypt.hash(password, salt, (err, hash) => {

                if (err) {
                    return reject(err);
                }
                resolve(hash)
            })
        })
    });
}

function comparePassword(plain, password) {
    return new Promise((resolve, reject) => {
        this.bcrypt.compare(plain, password, (err, res) => {
            if (err || !res) {
                return reject(err || 'Wrong/invalid mail or password');
            }
            resolve(res);
        });
    });
}

module.exports = fns;