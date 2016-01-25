'use strict';

const Joi = require('joi');

const db = require('./database');
const validation = require('./validation');

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
            if(err || !res) {
               reject();
            }
            resolve();
        });
    });
};


fns.login = (message, next) => {
    let _user = {};
    db.findUserByMail(message.data.mail)
        .then(user => {
            if (!user) {
                return Error('not found');
            }
            _user = user;
            return comparePassword(message.data.password, user.password)
                .then(() => {
                    return user;
                });
        })
        .then(deletePassword)
        .then(sessionData => next(null, sessionData))
        .catch(() => next({loggedIn: 'error'}));

};


fns.register = (message, next) => {
    let user = message.data;
    user.mail = user.mail.toLowerCase();
    db.findUserByMail(user.mail)
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
        .then(() => {
            delete user.password;

            let response = {
                sessionData: {
                    mail: user.mail,
                    _id: user._id,
                    name: user.name
                },
                user: user
            };

            next(null, response);
        })
        .catch(err => {
            if(err.message === 'exists') {
                next(null, {'exists': ''});
            } else {
                next(err);
            }
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
                if(isValid) {
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