'use strict';

const fns = {};

fns.getUser = mail => {
    //return database.collection('users').findOne({"mail": mail});
};

fns.createUser = user => {
    //return database.collection('users').insertOne(user);
};

module.exports = fns;