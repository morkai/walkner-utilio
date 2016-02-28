// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const mongodb = require('./utilio-mongodb');
const ports = require('./utilio-ports');

exports.id = 'utilio-controller';

exports.modules = [
  'health/backend',
  'mongodb',
  'events',
  'modbus',
  'collector',
  'messenger/server'
];

exports.mongodb = mongodb;

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
      'collector.saveFailed'
    ]
  },
  print: ['modbus.error']
};

exports['messenger/server'] = {
  pubHost: ports.controller.pubHost,
  pubPort: ports.controller.pubPort,
  repHost: ports.controller.repHost,
  repPort: ports.controller.repPort,
  broadcastTopics: ['events.saved']
};

exports.modbus = {
  writeAllTheThings: 'sim',
  maxReadQuantity: 25,
  ignoredErrors: [
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'ResponseTimeout'
  ],
  broadcastFilter: ['health'],
  controlMasters: ['sim'],
  masters: {
    sim: {
      defaultTimeout: 100,
      interval: 100,
      suppressTransactionErrors: true,
      transport: {
        type: 'ip'
      },
      connection: {
        type: 'tcp',
        host: '127.0.0.1',
        port: 502,
        noActivityTime: 2000
      }
    }
  },
  tagsFile: __dirname + '/tags.csv',
  tags: {}
};
