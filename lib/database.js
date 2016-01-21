'use strict';
const mongo = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://' + process.env['DB_HOST'] + ':' + process.env['DB_PORT'] + '/' + process.env['DB_NAME'];

const util = require('ms-utilities');

const fns = {};

var database = {};

fns.getUser = mail => {
    return database.collection('users')
        .find({'mail': mail})
        .limit(-1)
        .toArray();
};

fns.createUser = user => {
    return database.collection('users').insertOne(user);
};

fns.findUserById = userId => {
    return util.safeObjectId(userId, 'user_id')
        .then(oId => {
            return database.collection('users')
                .find({_id: oId})
                .limit(-1)
                .toArray();
        })
        .then(user => user.length ? Promise.resolve(user[0]) : Promise.resolve(null));
};

fns.findUsersById = userIdArray => {

    return Promise.all(userIdArray.map(sid => util.safeObjectId(sid, 'user_id')))
        .then(oIds => {
            return database.collection('users')
                .find({_id: {$in: oIds}})
                .toArray();
        });
};

fns.follow = (userId, toFollow, unfollow) => {
    let operation = unfollow ? '$pull' : '$addToSet';
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

fns.getFollowersByUserId = userId => {

    return database.collection('users')
        .find({'following': userId})
        .toArray();

};

fns.getFollowingByUserId = userId => {
    return fns.findUserById(userId)
        .then(user => user ? user.following : []);

};

fns.getFollowersCountByUserId = userId => {
    return database.collection('users')
        .count({
            following: userId
        });
};

fns.connect = () => {
    return mongo.connect(mongoUrl)
        .then(db => {
            database = db;
            console.log('Connected to mongodb');
            return database.collection('users').ensureIndex({'mail': 1}, {unique: true});
        })
        .catch(err => {
            console.error('Failed connecting to mongodb or failed ensuring index ', err);
        });
};


module.exports = fns;