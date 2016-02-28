'use strict';

const Joi = require('joi');

const db = require('./database');
const validation = require('./validation');
const util = require('./util');

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

        if (!plain || !password) {
            return reject('wrong_password');
        }

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

// simple pw generator
const make_passwd = (length) => {
    let a = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890';
    let index = (Math.random() * (a.length - 1)).toFixed(0);
    return length > 0 ? a[index] + make_passwd(length - 1, a) : '';
};


fns.login = (message, next) => {

    Joi.validate(message.data, validation.login, (err, user) => {

        if (err) {
            return util.validationError(err, 'login service', next);
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
                return comparePassword(user.password, _user.password);

            })
            .catch(err => {

                if (err === 'wrong_password') {

                    // check on possible temp pw
                    return comparePassword(user.password, _user.temp_pw)
                        .then(()=> {
                            return db.changePassword(_user._id, _user.temp_pw);
                        });

                } else {
                    throw err;
                }
            })
            .then(() => {

                delete _user.password;
                next(null, {data: _user});

                db.activateDevice(deviceId, _user._id);

                // delete temp pw if present
                if (_user.temp_pw) {
                    db.deleteTempPw(_user._id);
                }
            })
            .catch(err => {

                if (err === 'wrong_password') {
                    return next(null, {err: {msg: 'LOGIN_FAILED'}});
                }
                if (err.message === 'not found') {
                    return next(null, {err: {msg: 'NOT_FOUND', detail: 'User not found'}});
                }
                if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                    return next(null, {err: {msg: 'INVALID_ID', detail: 'Invalid user id'}});
                }

                return util.serviceError(err, 'Log in service', next);
            });

    });

};

fns.changePassword = (message, next) => {
    Joi.validate(message.data, validation.changePwd, (err, user) => {
        if (err) {
            return util.validationError(err, 'Change password service');
        }

        db.findUserById(user.user_id)
            .then(dbUser => comparePassword(user.old_password, dbUser.password))
            .then(() => generatePasswordToken(user.new_password))
            .then(hash => db.changePassword(user.user_id, hash))
            .then(() => next(null, {data: 'ok'}))
            .catch(err => {
                if (err.message === 'not found') {
                    return next(null, {err: {msg: 'NOT_FOUND', detail: 'User not found'}});
                }
                if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                    return next(null, {err: {msg: 'INVALID_ID', detail: 'Invalid user id'}});
                }
                if (err === 'wrong_password') {
                    return next(null, {err: {msg: 'LOGIN_FAILED', detail: 'Wrong password'}});
                }
                return util.serviceError(err, 'change password service', next);
            });
    });

};


fns.forgetPassword = (message, next) => {
    Joi.validate(message.data, validation.mail, (err, user) => {
        if (err) {
            return util.validationError(err, 'forget password service');
        }

        // create new password
        let newPw = make_passwd(7);

        generatePasswordToken(newPw)
            .then(hash => db.updateUserWithTempPassword(user.mail.toLocaleLowerCase(), hash))
            .then(() => next(null, {data: {new_password: newPw}}))
            .catch(err => {
                if (err.message === 'not found') {
                    return next(null, {err: {msg: 'NOT_FOUND', detail: 'User not found'}});
                }
                if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                    return next(null, {err: {msg: 'INVALID_ID', detail: 'Invalid user id'}});
                }
                return util.serviceError(err, 'forget password service', next);
            });
    });

};

fns.register = (message, next) => {

    Joi.validate(message.data, validation.register, (err, user) => {

        if (err) {
            return util.validationError(err, 'user register service', next);
        }

        let deviceId = user.requesting_device_id;
        delete user.requesting_device_id;


        db.findUserByMail(user.mail.toLocaleLowerCase())
            .then(user => {

                if (user) {
                    return next(null, {err: {msg: 'USER_EXISTS', detail: 'user with this mail already exists'}});
                }

                return generatePasswordToken(message.data.password);

            })
            .then(hash => {
                user.password = hash;
                user.mail = user.mail.toLowerCase();
                return db.createUser(user);
            })
            .then(result => {

                user._id = result.insertedId;
                delete user.password;

                next(null, {data: user});

                db.activateDevice(deviceId, user._id);
            })
            .catch(err => util.serviceError(err, 'User register service', next));
    });
};


fns.follow = (message, next) => {
    Joi.validate(message.data, validation.follow, (err, validatedData) => {

        if (err) {
            return util.validationError(err, 'user follow service', next);
        }
        // don't follow yourself
        if (validatedData.user_id === validatedData.to_follow) {
            return next(null, {err: {msg: 'SELF_FOLLOW', detail: 'Can\'t follow yourself'}});
        }

        db.findUserById(validatedData.to_follow)
            .then(() =>  db.follow(validatedData.user_id, validatedData.to_follow))
            .then(response => deletePassword(response.value))
            .then(user => next(null, {data: user}))
            .catch(err => {
                if (err.message === 'not found') {
                    return next(null, {err: {msg: 'NOT_FOUND', detail: 'User not found'}});
                }
                if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                    return next(null, {err: {msg: 'INVALID_ID', detail: 'Invalid user id'}});
                }
                return util.serviceError(err, 'follow service', next);
            });

    });
};

fns.getFollowers = (message, next) => {

    Joi.validate(message.data, validation.getUser, (err, user) => {

        if (err) {
            return util.validationError(err, 'get follower service ', next);
        }

        db.getFollowersByUserId(user.user_id)
            // little hack to remove password
            .then(follower => follower.map(deletePassword))
            .then(follower => next(null, {data: follower}))
            .catch(err => util.serviceError(err, 'Get Follower service', next));
    });
};

fns.getFollowing = (message, next) => {
    Joi.validate(message.data, validation.getFollowing, (err, data) => {

        if (err) {
            return util.validationError(err, 'get following service ', next);
        }

        db.getFollowingByUserId(data.user_id)
            .then(followingIds => db.findUsersById(followingIds))
            .then(following => following.map(deletePassword))
            .then(users => next(null, {data: users}))
            .catch(err => {
                if (err.message === 'not found') {
                    return next(null, {err: {msg: 'NOT_FOUND', detail: 'User not found'}});
                }
                if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                    return next(null, {err: {msg: 'INVALID_ID', detail: 'Invalid user id'}});
                }
                return util.serviceError(err, 'get following service', next);
            });
    });

};

fns.getUserById = (message, next) => {
    Joi.validate(message.data, validation.getUser, (err, user) => {

        if (err) {
            return util.validationError(err, 'get user by id service ', next);
        }

        db.findUserById(user.user_id)
            .then(user => deletePassword(user))
            .then(user => next(null, {data: user}))
            .catch(err => {
                if (err.message === 'not found') {
                    return next(null, {err: {msg: 'NOT_FOUND', detail: 'User not found'}});
                }
                if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                    return next(null, {err: {msg: 'INVALID_ID', detail: 'Invalid user id'}});
                }
                return util.serviceError(err, 'get user by id service', next);
            });
    });
};

fns.getFollowersCountByUserId = (message, next) => {
    Joi.validate(message.data, validation.getUser, (err, user) => {

        if (err) {
            return util.validationError(err, 'get followers count by user id service ', next);
        }

        db.getFollowersCountByUserId(user.user_id)
            .then(count => next(null, {count: count}))
            .catch(err => util.serviceError(err, 'get user by id service', next));
    });
};

module.exports = fns;
