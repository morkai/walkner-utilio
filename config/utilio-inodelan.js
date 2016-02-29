// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const mongodb = require('./utilio-mongodb');
const ports = require('./utilio-ports');

exports.id = 'utilio-inodelan';

exports.modules = [
  'health/endpoint',
  'mongodb',
  'events',
  'inodelan',
  'messenger/server',
  {id: 'messenger/client', name: 'messenger/client:utilio-controller'}
];

exports.mongodb = mongodb;
exports.mongodb.server.poolSize = 1;

exports.events = {
  mongooseId: null,
  userId: null,
  expressId: null,
  insertDelay: 1000,
  topics: {
    debug: [
      'app.started'
    ],
    info: [
      'events.**'
    ],
    success: [

    ],
    error: [

    ]
  },
  print: []
};

exports.inodelan = {
  listener: {
    serverOptions: {port: 503}
  },
  connections: [

  ],
  devices: [

  ]
};

exports['messenger/client:utilio-controller'] = {
  pubHost: ports.controller.pubHost,
  pubPort: ports.controller.pubPort,
  repHost: ports.controller.repHost,
  repPort: ports.controller.repPort,
  responseTimeout: 15000
};

exports['health/endpoint'] = {
  messengerClientId: 'messenger/client:utilio-controller'
};
