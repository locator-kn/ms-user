'use strict';
const mongo = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://' + process.env['DB_HOST'] + ':' + process.env['DB_PORT'] + '/' + process.env['DB_NAME'];

const util = require('ms-utilities');
const log = util.logger;

// define collection constants
const COLLECTION_USER = 'users';
const COLLECTION_DEVICE = 'devices';

const fns = {};

var database = {};

fns.connect = () => {
    return mongo.connect(mongoUrl)
        .then(db => {
            database = db;
            log.info('Connected to mongodb');
            return database.collection(COLLECTION_USER).createIndex({'mail': 1}, {unique: true});
        })
        .catch(err => {
            log.error(err, 'Failed connecting to mongodb or failed ensuring index ');
        });
};

fns.findUserByMail = mail => {
    return database.collection(COLLECTION_USER)
        .find({'mail': mail})
        .limit(-1)
        .toArray()
        .then(result => result.length ? result[0] : null);
};

fns.findUserByFbId = id => {
    return database.collection(COLLECTION_USER)
        .find({fbId: id})
        .limit(-1)
        .next();
};

fns.createUser = user => {
    return database.collection(COLLECTION_USER).insertOne(user);
};

fns.findUserById = userId => {
    return fns.genericById(userId, COLLECTION_USER);
};

fns.genericById = (id, collectionId) => {
    return util.safeObjectId(id)
        .then(oId => {
            return database.collection(collectionId)
                .find({_id: oId})
                .limit(-1)
                .next()
                .then(res => {
                    if (!res) {
                        log.error('No document found for', {collection: collectionId, id: id});
                        throw Error('not found');
                    }
                    return res;
                });
        });
};

fns.findUsersById = userIdArray => {

    return Promise.all(userIdArray.map(sid => util.safeObjectId(sid, 'user_id')))
        .then(oIds => {
            return database.collection(COLLECTION_USER)
                .find({_id: {$in: oIds}})
                .toArray();
        });
};

fns.activateDevice = (deviceId, userId) => {
    database.collection(COLLECTION_DEVICE).updateOne(
        {
            _id: deviceId
        },
        {
            $set: {
                user_id: userId,
                active: true
            }
        },
        err => {
            if (err) {
                log.error(err, 'Error updating device to active', {userid: userId, deviceId: deviceId});
            }
        }
    );
};

fns.updateUserWithTempPassword = (mail, hash) => {
    return database.collection(COLLECTION_USER).findOneAndUpdate(
        {
            mail: mail
        },
        {
            $set: {
                temp_pw: hash
            }
        }).then(res => {
        if (!res.value) {
            log.error('No document found for', {collection: 'users', mail: mail});
            throw Error('not found');
        }
        return res;
    });

};

fns.deactivateDevice = (deviceId, callback) => {
    database.collection(COLLECTION_DEVICE).updateOne(
        {
            _id: deviceId
        },
        {
            $set: {active: false}
        }, err => {
            if (err) {
                log.error(err, 'Error updating device to inactive', {deviceId: deviceId});
                return callback(err);
            } else {
                return callback(null, {data: {ok: true}});
            }
        });
};

fns.upsertDevice = device => {

    device._id = device.deviceId;
    delete device.deviceId;

    return database.collection(COLLECTION_DEVICE).updateOne({_id: device._id}, device, {upsert: true});
};

fns.updateFollow = (userId, toFollow, unfollow) => {
    let operation = unfollow ? '$pull' : '$addToSet';
    let updateObject = {};
    updateObject[operation] = {
        following: toFollow
    };

    return util.safeObjectId(userId, 'user_id')
        .then(oId => {
            return database.collection(COLLECTION_USER)
                .findOneAndUpdate(
                    {_id: oId},
                    updateObject,
                    {returnOriginal: false});
        });
};


fns.addImageToUser = (userId, images) => {
    return util.safeObjectId(userId, 'user_id')
        .then(oId => {
            return database.collection(COLLECTION_USER)
                .findOneAndUpdate(
                    {_id: oId},
                    {
                        $set: {
                            images: images
                        }
                    },
                    {returnOriginal: false});
        });
};


fns.getFollowersByUserId = userId => {

    return database.collection(COLLECTION_USER)
        .find({'following': userId})
        .toArray();

};

fns.getFollowingByUserId = userId => {
    return fns.findUserById(userId)
        .then(user => (user && user.following) ? user.following : []);

};

fns.getFollowersCountByUserId = userId => {
    return database.collection(COLLECTION_USER)
        .count({
            following: userId
        });
};

fns.changePassword = (userId, pw) => {
    return database.collection(COLLECTION_USER)
        .updateOne(
            {_id: userId},
            {
                $set: {
                    password: pw
                }
            });
};

fns.deleteTempPw = (userId) => {
    database.collection(COLLECTION_USER)
        .updateOne(
            {_id: userId},
            {
                $unset: {
                    temp_pw: ''
                }
            })
        .catch(err => {
            log.warn('Unable to delete old temp pw', {error: err});
        });
};

module.exports = fns;
