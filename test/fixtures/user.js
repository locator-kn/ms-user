'use strict';

const fixtures = {};

fixtures.userLoginPass = {
    data: {
        'mail': 'abc123',
        'passwd': 'klartext'
    }
};
fixtures.userLoginWithHashPass = {
    data: {
        'mail': 'abc123',
        // TODO: add hash of "klartext"
        'passwd': '012bb2568b1842959293402b06b42170'
    }
};
fixtures.userRegisterPass = {
    data: {
        'mail': 'abc123',
        'passwd': '012bb2568b1842959293402b06b42170'
    }
};

module.exports = fixtures;