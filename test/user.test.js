'use strict';
import test from 'ava';
const proxyquire =  require('proxyquire');
const userFixtures = require('./fixtures/user');

const databaseStub = require('./stubs/database.stub');
const user = proxyquire('../lib/user', { './database': databaseStub });

test('user.login', t => {
    user.login(userFixtures.userLoginPass, (err, data) => {
        t.not(void 0, data);
        t.is(null, err);
    });
});

test('user.register', t => {
    user.register(userFixtures.userRegisterPass, (err, data) => {
        t.not(null, err);
        t.is('ValidationError', err);
        t.is(void 0, data);
    });
});
