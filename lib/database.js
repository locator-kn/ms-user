'use strict';
const mongo = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://' + process.env['DB_HOST'] + ':' + process.env['DB_PORT'] + '/' + process.env['DB_NAME'];

const util = require('ms-utilities');
const slack = util.slack;

// define collection constants
const COLLECTION_USER = 'users';
const COLLECTION_DEVICE = 'devices';

const fns = {};

var database = {};

fns.connect = () => {
    return mongo.connect(mongoUrl)
        .then(db => {
            database = db;
            console.log('Connected to mongodb');
            return database.collection(COLLECTION_USER).createIndex({'mail': 1}, {unique: true});
        })
        .catch(err => {
            console.error('Failed connecting to mongodb or failed ensuring index ', err);
        });
};

fns.findUserByMail = mail => {
    return database.collection(COLLECTION_USER)
        .find({'mail': mail})
        .limit(-1)
        .toArray()
        .then(result => result.length ? result[0] : null);
};

fns.createUser = user => {
    return database.collection(COLLECTION_USER).insertOne(user);
};

fns.findUserById = userId => {
    return util.safeObjectId(userId, 'user_id')
        .then(oId => {
            return database.collection(COLLECTION_USER)
                .find({_id: oId})
                .limit(-1)
                .toArray();
        })
        .then(user => user.length ? Promise.resolve(user[0]) : Promise.resolve(null));
};

fns.findUsersById = userIdArray => {

    return Promise.all(userIdArray.map(sid => util.safeObjectId(sid, 'user_id')))
        .then(oIds => {
            return database.collection(COLLECTION_USER)
                .find({_id: {$in: oIds}})
                .toArray();
        });
};

fns.activateDevice = (deviceId, userId, pushToken) => {
    database.collection(COLLECTION_DEVICE).updateOne(
        {
            _id: deviceId
        },
        {
            $set: {
                user_id: userId,
                pushToken: pushToken,
                active: true
            }
        },
        (err) => {
            if (err) {
                console.log(err); //TODO
            }
        }
    );
};

fns.deactivateDevice = (deviceId) => {
    database.collection(COLLECTION_DEVICE).updateOne(
        {
            _id: deviceId
        },
        {
            $set: {
                active: false
            }
        },
        (err) => {
            if (err) {
                console.log(err); //TODO
            }
        }
    );
};

fns.upsertDevice = device => {

    device._id = device.deviceId;
    delete device.deviceId;

    return database.collection(COLLECTION_DEVICE).updateOne({_id: device._id}, device, {upsert: true});
};

fns.follow = (userId, toFollow, unfollow) => {
    let operation = unfollow ? '$pull' : '$addToSet';
    let updateObject = {};
    updateObject[operation] = {
        following: toFollow
    };

    return util.safeObjectId(userId, 'user_id')
        .then(oId => {
            return database.collection(COLLECTION_USER)
                .findOneAndUpdate({_id: oId}, updateObject);
        });
};

fns.getFollowersByUserId = userId => {

    return database.collection(COLLECTION_USER)
        .find({'following': userId})
        .toArray();

};

fns.getFollowingByUserId = userId => {
    return fns.findUserById(userId)
        .then(user => user ? user.following : []);

};

fns.getFollowersCountByUserId = userId => {
    return database.collection(COLLECTION_USER)
        .count({
            following: userId
        });
};


module.exports = fns;
