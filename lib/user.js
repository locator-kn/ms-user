'use strict';

const db = require('./database');

const fns = {};

const bcrypt = require('bcrypt');

fns.login = (message, next) => {
    var _user = {};
    return db.getUser(message.data.mail)
        .then(user => {
            if(user === null) {
                return Promise.resolve(false)
            }
            _user = user;
            return comparePassword(message.data.password, user.password);
        })
        .then( res => {
            if(res) {
                var sessionData = {
                    mail: _user.mail
                }
                next(null, sessionData);
            } else {
                next(null, {msg: "you failed"});
            }
        })
        .catch( err => {
            next({loggedIn: "error"});
        });

};

fns.logout = (message, next) => {
    next(null, {msg: "not implemented"});
};


fns.register = (message, next) => {
    var user = message.data;
    return generatePasswordToken(message.data.password)
        .then(hash => {
            user.password = hash;
            return db.createUser(user);
        })
        .then(result => {
            next(null, {msg: "registered"});
        })
        .catch(err => {
            next({msg: "failed to register, couldn't create user"});
        });
};

function generatePasswordToken(password) {
    return new Promise((resolve, reject) => {

        bcrypt.genSalt(10, (err, salt) => {

            if (err) {
                return reject(err);
            }
            bcrypt.hash(password, salt, (err, hash) => {

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
        bcrypt.compare(plain, password, (err, res) => {
            if (err) {
                return reject(err);
            }
            resolve(res);
        });
    });
}

module.exports = fns;