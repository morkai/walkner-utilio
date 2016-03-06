// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const later = require('later');
const mongodb = require('./utilio-mongodb');
const ports = require('./utilio-ports');

later.date.localTime();

exports.id = 'utilio-watchdog';

exports.modules = [
  'health/endpoint',
  'updater',
  'mongoose',
  'settings',
  'events',
  'pubsub',
  'mail/sender',
  'twilio',
  'messenger/server',
  'watchdog'
];

exports.dictionaryModules = {

};

exports.events = {
  collection: function(app) { return app.mongoose.model('Event').collection; },
  insertDelay: 1000,
  topics: {
    debug: [

    ],
    info: [
      'events.**'
    ],
    warning: [

    ],
    error: [
      'app.started'
    ]
  },
  blacklist: [

  ]
};

exports.pubsub = {
  statsPublishInterval: 10000,
  republishTopics: [
    'events.saved'
  ]
};

exports.mongoose = {
  uri: mongodb.uri,
  options: mongodb,
  maxConnectTries: 10,
  connectAttemptDelay: 500,
  models: [
    'setting', 'event', 'user',
    'twilioRequest', 'twilioResponse'
  ]
};
exports.mongoose.options.server.poolSize = 2;

exports['messenger/server'] = {
  pubHost: ports.watchdog.pubHost,
  pubPort: ports.watchdog.pubPort,
  repHost: ports.watchdog.repHost,
  repPort: ports.watchdog.repPort,
  responseTimeout: 5000,
  broadcastTopics: [
    'events.saved'
  ]
};

exports.updater = {
  expressId: null,
  sioId: null,
  packageJsonPath: __dirname + '/../package.json',
  restartDelay: 1337,
  versionsKey: 'utilio',
  backendVersionKey: 'watchdog',
  frontendVersionKey: null
};

exports['mail/sender'] = {
  from: 'Utilio Bot <wmes@localhost>'
};

exports.twilio = {

};

exports.watchdog = {
  recipients: [],
  appStartedRecipients: [],
  noEventRecipients: [],
  events: [],
  emptyDirectories: []
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
