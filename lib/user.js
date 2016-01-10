'use strict';

const Joi = require('joi');

const db = require('./database');
const validation = require('./validation');

const fns = {};

const bcrypt = require('bcrypt');

fns.login = (message, next) => {
    let _user = {};
    return db.getUser(message.data.mail)
        .then(user => {
            if (user === null) {
                return Promise.resolve(false);
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
                next({msg: 'you failed'});
            }
        })
        .catch(err => {
            next({loggedIn: 'error'});
        });

};


fns.register = (message, next) => {
    let user = message.data;
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
            let sessionData = {
                mail: user.mail,
                _id: user._id,
                name: user.name
            };
            next(null, sessionData);
        })
        .catch(err => {
            if (err === 'exists') {
                next({error: 'user already exists'});
            } else {
                console.log(err);
                next({error: 'failed generating password token'});
            }
        });
};

fns.follow = (message, next) => {
    Joi.validate(message.data, validation.follow, (err, validatedData) => {
        if (err) {
            return next(err);
        }
        // don't follow yourself
        if(validatedData.user_id === validatedData.to_follow) {
            return next(Error('loner_alert'));
        }

        console.log(validatedData);


        db.findUserById(validatedData.to_follow)
            .then(res => {
                return !!res.length;
            })
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
        .then(follower => follower.map(elem => delete elem.password ? elem : elem))
        .then(follower => next(null, follower))
        .catch(next);
};

fns.getFollowing = (message, next) => {
    db.getFollowingByUserId(message.data.user_id)
        .then(followingIds => db.findUsersById(followingIds))
        .then(following => following.map(elem => delete elem.password ? elem : elem))
        .then(users => next(null, users))
        .catch(next);
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
                resolve(hash);
            });
        });
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