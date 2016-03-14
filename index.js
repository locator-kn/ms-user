'use strict';

const path = require('path');
const pwd = path.join(__dirname, '..', '/.env');
require('dotenv').config({path: pwd});


const util = require('ms-utilities');
const seneca = require('seneca')();
const user = require('./lib/user');
const device = require('./lib/device');
const database = require('./lib/database');


// select desired transport method
//const transportMethod = process.env['SENECA_TRANSPORT_METHOD'] || 'rabbitmq';
const patternPin = 'role:user';

// init database and then seneca and expose functions
database.connect()
    .then(() => {
        seneca
        //.use(transportMethod + '-transport')

            .client({type: 'tcp', port: 7010, host: 'localhost', pin: 'role:reporter'})

            .add(patternPin + ',cmd:register,entity:device', device.registerDevice)
            .add(patternPin + ',cmd:unregister,entity:device', device.unregisterDevice)
            .add(patternPin + ',cmd:register,entity:user', user.register)
            .add(patternPin + ',cmd:get,entity:pushToken',device.getPushToken)

            .add(patternPin + ',cmd:add,entity:image', user.addImageToUser)

            .add(patternPin + ',cmd:changePwd', user.changePassword)
            .add(patternPin + ',cmd:forgetPassword', user.forgetPassword)
            .add(patternPin + ',cmd:login', user.login)
            .add(patternPin + ',cmd:follow', user.follow)
            .add(patternPin + ',cmd:getfollowers', user.getFollowers)
            .add(patternPin + ',cmd:getfollowing', user.getFollowing)
            .add(patternPin + ',cmd:getUserById', user.getUserById)
            .add(patternPin + ',cmd:count,entity:follower,by:userId', user.getFollowersCountByUserId)
            .add(patternPin + ',cmd:fbLogin', user.fbLogin)
            .add(patternPin + ',cmd:unfollow',user.unFollow)
            //.act({
            //    role: 'user',
            //    cmd: 'fbLogin',
            //    data: {
            //        id: '1420825108994320',
            //        email: 'some@email.com',
            //        name: 'some name'
            //    }
            //}, (err, data) => {
            //    console.log('follow resp:', err || data);
            //})
            //.listen({type: transportMethod, pin: patternPin});
            .listen({type: 'tcp', port: 7002, pin: patternPin})
            .wrap(patternPin, util.reporter.report);
    });