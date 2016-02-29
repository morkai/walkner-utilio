// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const mongodb = require('./utilio-mongodb');
const ports = require('./utilio-ports');
const later = require('later');

later.date.localTime();

try
{
  require('pmx').init({
    ignore_routes: [/socket\.io/, /sio/] // eslint-disable-line camelcase
  });
}
catch (err) {} // eslint-disable-line no-empty

exports.id = 'utilio-frontend';

exports.modules = [
  'health/endpoint',
  'updater',
  'mongoose',
  'settings',
  'events',
  'pubsub',
  'user',
  'express',
  'users',
  'permalinks',
  'controller',
  'mail/sender',
  'messenger/server',
  {id: 'messenger/client', name: 'messenger/client:utilio-controller'},
  {id: 'messenger/client', name: 'messenger/client:utilio-alarms'},
  {id: 'messenger/client', name: 'messenger/client:utilio-watchdog'},
  'httpServer',
  'sio'
];

exports.mainJsFile = '/utilio-main.js';
exports.mainCssFile = '/assets/utilio-main.css';
exports.faviconFile = 'assets/utilio-favicon.ico';

exports.frontendAppData = {

};

exports.dictionaryModules = {

};

exports.events = {
  collection: function(app) { return app.mongoose.model('Event').collection; },
  insertDelay: 1000,
  topics: {
    debug: [
      'users.login', 'users.logout',
      '*.added', '*.edited'
    ],
    info: [
      'events.**',
      'controller.settingChanged'
    ],
    warning: [
      'users.loginFailure',
      '*.deleted',
      'controller.tagValueSet'
    ],
    error: [
      '*.syncFailed',
      'app.started'
    ]
  },
  blacklist: [

  ]
};

exports.httpServer = {
  host: '0.0.0.0',
  port: 80
};

exports.sio = {
  httpServerIds: ['httpServer'],
  socketIo: {
    pingInterval: 10000,
    pingTimeout: 5000
  }
};

exports.pubsub = {
  statsPublishInterval: 60000,
  republishTopics: [
    'events.saved',
    '*.added', '*.edited', '*.deleted', '*.synced',
    'updater.newVersion',
    'settings.updated.**',
    'alarms.**',
    'controller.tagsChanged', 'controller.tagValuesChanged'
  ]
};

exports.mongoose = {
  uri: mongodb.uri,
  options: mongodb,
  maxConnectTries: 10,
  connectAttemptDelay: 500,
  models: [
    'setting', 'event', 'user', 'passwordResetRequest'
  ]
};
exports.mongoose.options.server.poolSize = 10;

exports.express = {
  staticPath: __dirname + '/../frontend',
  staticBuildPath: __dirname + '/../frontend-build',
  sessionCookieKey: 'utilio.sid',
  sessionCookie: {
    httpOnly: true,
    path: '/',
    maxAge: null
  },
  sessionStore: {
    touchChance: 0.20
  },
  cookieSecret: '1ee7|_|7!|_!0',
  ejsAmdHelpers: {
    t: 'app/i18n'
  },
  textBody: {limit: '1mb'},
  jsonBody: {limit: '1mb'}
};

exports.user = {
  localAddresses: [/^192\.168\./],
  privileges: [
    'USERS:VIEW', 'USERS:MANAGE',
    'EVENTS:VIEW', 'EVENTS:MANAGE',
    'DICTIONARIES:VIEW', 'DICTIONARIES:MANAGE',
    'SETTINGS:MANAGE'
  ]
};

exports.users = {

};

exports['messenger/server'] = {
  pubHost: ports.frontend.pubHost,
  pubPort: ports.frontend.pubPort,
  repHost: ports.frontend.repHost,
  repPort: ports.frontend.repPort,
  responseTimeout: 5000,
  broadcastTopics: [

  ]
};

exports['messenger/client:utilio-watchdog'] = {
  pubHost: ports.watchdog.pubHost,
  pubPort: ports.watchdog.pubPort,
  repHost: ports.watchdog.repHost,
  repPort: ports.watchdog.repPort,
  responseTimeout: 5000
};

exports['messenger/client:utilio-controller'] = {
  pubHost: ports.controller.pubHost,
  pubPort: ports.controller.pubPort,
  repHost: ports.controller.repHost,
  repPort: ports.controller.repPort,
  responseTimeout: 15000
};

exports['messenger/client:utilio-alarms'] = {
  pubHost: ports.alarms.pubHost,
  pubPort: ports.alarms.pubPort,
  repHost: ports.alarms.repHost,
  repPort: ports.alarms.repPort,
  responseTimeout: 5000
};

exports.updater = {
  manifestPath: __dirname + '/utilio-manifest.appcache',
  packageJsonPath: __dirname + '/../package.json',
  restartDelay: 5000,
  pull: {
    exe: 'git.exe',
    cwd: __dirname + '/../',
    timeout: 30000
  },
  versionsKey: 'utilio',
  manifests: [
    {
      path: '/manifest.appcache',
      mainJsFile: exports.mainJsFile,
      mainCssFile: exports.mainCssFile
    }
  ]
};

exports['mail/sender'] = {
  from: 'WMES Bot <wmes@localhost>'
};

exports['health/endpoint'] = {
  messengerClientId: 'messenger/client:utilio-controller'
};

exports.controller = {
  messengerClientId: 'messenger/client:utilio-controller'
};

exports['alarms/frontend'] = {
  messengerClientId: 'messenger/client:utilio-alarms'
};
