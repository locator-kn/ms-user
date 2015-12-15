'use strict';
require('dotenv').config({path: '../.env'});

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
            .use(transportMethod + '-transport')
            .add(patternPin + ',cmd:login', user.login)
            .add(patternPin + ',cmd:logout', user.logout)
            .add(patternPin + ',cmd:register', user.register)
            .listen({type: transportMethod, pin: patternPin});
    });