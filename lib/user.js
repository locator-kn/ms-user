'use strict';

const Joi = require('joi');

const db = require('./database');
const validation = require('./validation');

const util = require('ms-utilities');
const log = util.logger;

const fns = {};

const bcrypt = require('bcrypt');

const deletePassword = (elem => {
    delete elem.password;
    return elem;
});

const generatePasswordToken = password => {
    return new Promise((resolve, reject) => {

        bcrypt.genSalt(10, (err, salt) => {

            if (err) {
                return reject(err);
            }
            bcrypt.hash(password, salt, (err, hash) => {

                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    });
};

const comparePassword = (plain, password) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(plain, password, (err, res) => {

            if (err) {
                return reject(err);
            }

            if (!res) {
                return reject('wrong_password');
            }

            return resolve();
        });
    });
};


fns.login = (message, next) => {

    Joi.validate(message.data, validation.login, (err, user) => {

        if (err) {
            log.error(err, 'Validation failed of login service');
            return next(err);
        }

        let deviceId = user.requesting_device_id;
        delete user.requesting_device_id;

        let _user = {};

        db.findUserByMail(user.mail.toLocaleLowerCase())
            .then(dbUser => {

                if (!dbUser) {
                    return next(null, {err: {msg: 'LOGIN_FAILED'}});
                }
                _user = dbUser;
                return comparePassword(user.password, dbUser.password);
            })
            .then(() => {

                delete _user.password;
                next(null, {data: _user});

                db.activateDevice(deviceId, _user._id);
            })
            .catch(err => {

                if (err === 'wrong_password') {
                    return next(null, {err: {msg: 'LOGIN_FAILED'}});
                }

                log.error(err, 'Login sevice failed');
                next(err);
            });

    });

};


fns.register = (message, next) => {

    Joi.validate(message.data, validation.register, (err, user) => {

        if (err) {
            return next(err);
        }

        let deviceId = user.requesting_device_id;
        delete user.requesting_device_id;


        db.findUserByMail(user.mail.toLocaleLowerCase())
            .then(user => {
                if (user !== null) {
                    throw new Error('exists');
                } else {
                    return generatePasswordToken(message.data.password);
                }
            })
            .then(hash => {
                user.password = hash;
                return db.createUser(user);
            })
            .then(result => {

                user._id = result.insertedId;
                delete user.password;

                next(null, user);

                db.activateDevice(deviceId, user._id);
            })
            .catch(err => {
                if (err.message === 'exists') {
                    next(null, {'exists': ''});
                } else {
                    next(err);
                }
            });
    });
};


fns.registerDevice = (message, next) => {

    Joi.validate(message.data, validation.registerDevice, (err, device) => {

        if (err) {
            return next(err);
        }

        db.upsertDevice(message.data)
            .then(() => {

                next(null, {deviceId: device.deviceId});
            })
            .catch(err => next(err));
    });
};

fns.unregisterDevice = (message, next) => {

    Joi.validate(message.data, validation.unregisterDevice, (err, device) => {

        if (err) {
            return next(err);
        }

        db.deactivateDevice(device.deviceId, next);
    });
};

fns.follow = (message, next) => {
    Joi.validate(message.data, validation.follow, (err, validatedData) => {
        if (err) {
            return next(err);
        }
        // don't follow yourself
        if (validatedData.user_id === validatedData.to_follow) {
            return next(Error('loner_alert'));
        }

        db.findUserById(validatedData.to_follow)
            .then(isValid => {
                if (isValid) {
                    return db.follow(validatedData.user_id, validatedData.to_follow);
                }
                throw new Error('invalid to_follow id');
            })
            .then(response => next(null, response.value))
            .catch(next);

    });
};

fns.getFollowers = (message, next) => {
    db.getFollowersByUserId(message.data.user_id)
        // little hack to remove passwd
        .then(follower => follower.map(deletePassword))
        .then(follower => next(null, follower))
        .catch(next);
};

fns.getFollowing = (message, next) => {
    db.getFollowingByUserId(message.data.user_id)
        .then(followingIds => db.findUsersById(followingIds))
        .then(following => following.map(deletePassword))
        .then(users => next(null, users))
        .catch(next);
};

fns.getUserById = (message, next) => {
    db.findUserById(message.data.user_id)
        .then(user => {
            if (user) {
                delete user.password;
            }
            next(null, user);
        })
        .catch(next);
};

fns.getFollowersCountByUserId = (message, next) => {
    db.getFollowersCountByUserId(message.data.user_id)
        .then(count => next(null, {count: count}))
        .catch(next);
};

module.exports = fns;