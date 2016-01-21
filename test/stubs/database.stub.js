'use strict';

const fns = {};

const userFixtures = require('../fixtures/user');

fns.getUser = mail => {
    //return database.collection('users').findOne({"mail": mail});
    if (mail === userFixtures.userLoginPass.data.mail) {
        return Promise.resolve(userFixtures.userRegisterPass.data);
    }
    return Promise.resolve(null);
};

fns.createUser = user => {
    Promise.resolve(user);
    //return database.collection('users').insertOne(user);
};

module.exports = fns;