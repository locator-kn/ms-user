'use strict';
const mongo = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://' + process.env['DB_HOST'] + ':' + process.env['DB_PORT'] + '/' + process.env['DB_NAME'];


const fns = {};

var database = {};

fns.getAllUsers = (message) => {
    if (message.cmd !== 'login') {
        return Promise.reject({message: 'cmd was not login', code: 4000});
    }
    return Promise.resolve({doc: 'yoooo', processId: process.pid});
};

fns.connect = () => {
    return mongo.connect(mongoUrl)
        .then(db => {
            database = db;
            console.log("Connected to mongodb");
        })
        .catch(err => {
            console.error("Failed connecting to mongodb ", err);
        });
};


module.exports = fns;