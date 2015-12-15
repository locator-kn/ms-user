'use strict';
const mongo = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://localhost:27017/unicorn';

const fns = {};


/**
 * gets all users from the database
 * @param message - some param
 * @returns {*}
 */
fns.getAllUsers = (message) => {
    if (message.cmd !== 'login') {
        return Promise.reject({message: 'cmd was not login', code: 4000});
    }
    return Promise.resolve({doc: 'yoooo', processId: process.pid});
};

/**
 * connects to the database
 * @returns {Promise|*}
 */
fns.connect = () => {
    return mongo.connect(mongoUrl);
};


module.exports = fns;