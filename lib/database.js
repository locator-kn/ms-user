'use strict';
const mongo = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://' + process.env['DB_HOST'] + ':' + process.env['DB_PORT'] + '/' + process.env['DB_NAME'];


const fns = {};

var database = {};

fns.getUser = mail => {
    return database.collection('users').findOne({"mail": mail});
};

fns.createUser = user => {
     return database.collection('users').insertOne(user);
}

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