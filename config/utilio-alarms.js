// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const mongodb = require('./utilio-mongodb');
const ports = require('./utilio-ports');

exports.id = 'utilio-alarms';

exports.modules = [
  'health/endpoint',
  'mongoose',
  'events',
  'messenger/server',
  'mail/sender',
  'sms/sender',
  {id: 'messenger/client', name: 'messenger/client:utilio-controller'},
  'controller',
  'alarms/backend'
];

exports.events = {
  expressId: null,
  collection: function(app) { return app.mongoose.model('Event').collection; },
  insertDelay: 1000,
  topics: {
    debug: [
      'app.started',
      'alarms.actionExecuted'
    ],
    info: [
      'events.**',
      'alarms.run',
      'alarms.activated'
    ],
    success: [
      'alarms.deactivated'
    ],
    warning: [
      'alarms.stopped'
    ],
    error: [
      'alarms.compileFailed',
      'alarms.conditionCheckFailed',
      'alarms.actions.emailFailed',
      'alarms.actions.smsFailed'
    ]
  }
};

exports.mongoose = {
  uri: mongodb.uri,
  options: mongodb,
  maxConnectTries: 10,
  connectAttemptDelay: 500,
  models: [
    'setting', 'event', 'user',
    'alarm',
    'twilioRequest', 'twilioResponse'
  ]
};
exports.mongoose.options.server.poolSize = 4;

exports['messenger/server'] = {
  pubHost: ports.alarms.pubHost,
  pubPort: ports.alarms.pubPort,
  repHost: ports.alarms.repHost,
  repPort: ports.alarms.repPort,
  broadcastTopics: [
    'events.saved',
    'alarms.**'
  ]
};

exports['messenger/client:utilio-controller'] = {
  pubHost: ports.controller.pubHost,
  pubPort: ports.controller.pubPort,
  repHost: ports.controller.repHost,
  repPort: ports.controller.repPort,
  responseTimeout: 5000
};

exports.controller = {
  messengerClientId: 'messenger/client:utilio-controller',
  pubsub: null,
  expressId: null
};

exports['mail/sender'] = {
  from: 'Utilio Bot <wmes@localhost>'
};

exports['sms/sender'] = {
  from: 'Utilio Bot <wmes@localhost>'
};

exports.twilio = {

};

exports['health/endpoint'] = {
  messengerClientId: 'messenger/client:utilio-controller'
};
