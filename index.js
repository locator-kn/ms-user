'use strict';

const path = require('path');
const pwd = path.join(__dirname, '..', '/.env');
require('dotenv').config({path: pwd});

const seneca = require('seneca')();
const user = require('./lib/user');
const database = require('./lib/database');


// select desired transport method
const transportMethod = process.env['SENECA_TRANSPORT_METHOD'] || 'rabbitmq';
const patternPin = 'role:user';

// init database and then seneca and expose functions
database.connect()
    .then(() => {
        seneca
            //.use(transportMethod + '-transport')
            .add(patternPin + ',cmd:login', user.login)
            .add(patternPin + ',cmd:register', user.register)
            //.listen({type: transportMethod, pin: patternPin});
            .listen({type: 'tcp', port: 7002, pin: patternPin});
    });