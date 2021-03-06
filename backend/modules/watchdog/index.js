// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

var setUpNoEventCheck = require('./noEventCheck');
var setUpAppStartedEventCheck = require('./appStartedEventCheck');
var setUpEmptyDirectoryCheck = require('./emptyDirectoryCheck');

exports.DEFAULT_CONFIG = {
  mongooseId: 'mongoose',
  mailSenderId: 'mail/sender',
  twilioId: 'twilio',
  recipients: [],
  appStartedRecipients: [],
  appStartedCallRecipient: null,
  noEventRecipients: [],
  events: [],
  emptyDirectories: []
};

exports.start = function startWatchdogModule(app, watchdogModule)
{
  app.onModuleReady(
    [
      watchdogModule.config.mongooseId,
      watchdogModule.config.mailSenderId
    ],
    setUpNoEventCheck.bind(null, app, watchdogModule)
  );

  app.onModuleReady(
    [
      watchdogModule.config.mongooseId,
      watchdogModule.config.mailSenderId
    ],
    setUpAppStartedEventCheck.bind(null, app, watchdogModule)
  );

  setUpEmptyDirectoryCheck(app, watchdogModule);
};
