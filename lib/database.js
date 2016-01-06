'use strict';
const mongo = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://' + process.env['DB_HOST'] + ':' + process.env['DB_PORT'] + '/' + process.env['DB_NAME'];

const util = require('./util');

const fns = {};

var database = {};

fns.getUser = mail => {
    return database.collection('users').findOne({"mail": mail});
};

fns.createUser = user => {
    return database.collection('users').insertOne(user);
};

fns.findUserById = userId => {
    return util.safeObjectId(userId, 'user_id')
        .then(oId => {
            console.log(oId)
            return database.collection('users')
                .find({_id: oId})
                .limit(-1)
                .toArray();
        });
};

fns.follow = (userId, toFollow, unfollow) => {
    let operation = unfollow ? '$pull' : '$push';
    let updateObject = {};
    updateObject[operation] = {
        following: toFollow
    };

    return util.safeObjectId(userId, 'user_id')
        .then(oId => {
            return database.collection('users')
                .findOneAndUpdate({_id: oId}, updateObject);
        });
};

fns.connect = () => {
    return mongo.connect(mongoUrl)
        .then(db => {
            database = db;
            console.log("Connected to mongodb");
            return database.collection('users').ensureIndex({'mail': 1}, {unique: true});
        })
        .catch(err => {
            console.error("Failed connecting to mongodb or failed ensuring index ", err);
        });
};


module.exports = fns;