'use strict';

const db = require('./database');

const fns = {};

const bcrypt = require('bcrypt');

fns.login = (message, next) => {
    var _user = {};
    return db.getUser(message.data.mail)
        .then(user => {
            if (user === null) {
                return Promise.resolve(false)
            }
            _user = user;
            return comparePassword(message.data.password, user.password);
        })
        .then(passwordMatched => {
            if (passwordMatched) {

                let sessionData = _user;

                delete sessionData.password;

                next(null, sessionData);
            } else {
                next(null, {msg: "you failed"});
            }
        })
        .catch(err => {
            next(null, {loggedIn: "error"});
        });

};


fns.register = (message, next) => {
    var user = message.data;
    user.mail = user.mail.toLowerCase();
    db.getUser(user.mail)
        .then(user => {
            if (user !== null) {
                return Promise.reject('exists');
            } else {
                return generatePasswordToken(message.data.password);
            }
        })
        .then(hash => {
            user.password = hash;
            return db.createUser(user);
        })
        .then(() => {
            var sessionData = {
                mail: user.mail,
                _id: user._id,
                name: user.name
            }
            next(null, sessionData);
        })
        .catch(err => {
            if (err == 'exists') {
                next(null, {error: 'user already exists'});
            } else {
                console.log(err);
                next(null, {error: 'failed generating password token'});
            }
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