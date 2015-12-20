'use strict';
import test from 'ava';
const proxyquire =  require('proxyquire');
const userFixtures = require('./fixtures/user');

const databaseStub = require('./stubs/database.stub');
const user = proxyquire('../lib/user', { './database': databaseStub });

test('user.login', t => {
    user.login(userFixtures.userLoginPass, (err, data) => {
        if(err) {
            return t.fail();
        }
        console.log(data);
        t.pass();
    });
});

test('user.register', t => {
    user.register(userFixtures.userRegisterPass, (err, data) => {

        if(err) {
            return t.pass(err.message);
        }
        return t.fail('should return error');
    });
});
