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
            .add(patternPin + ',cmd:changePwd', user.changePwd)
            .add(patternPin + ',cmd:login', user.login)
            .add(patternPin + ',cmd:follow', user.follow)
            .add(patternPin + ',cmd:getfollowers', user.getFollowers)
            .add(patternPin + ',cmd:getfollowing', user.getFollowing)
            .add(patternPin + ',cmd:getUserById', user.getUserById)
            .add(patternPin + ',cmd:count,entity:follower,by:userId', user.getFollowersCountByUserId)
            //.act({
            //    role: 'user',
            //    cmd: 'follow',
            //    data: {
            //        user_id: '567857f5de1d4c5a4fd81d01',
            //        to_follow: '567857f5de1d4c5a4fd81d03'
            //    }
            //}, (err, data) => {
            //    console.log('follow resp:', err || data);
            //})
            //.listen({type: transportMethod, pin: patternPin});
            .listen({type: 'tcp', port: 7002, pin: patternPin})
            .wrap(patternPin, util.reporter.report);
    });