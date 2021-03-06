// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

module.exports = function setUpSettingsRoutes(app, settingsModule)
{
  var express = app[settingsModule.config.expressId];
  var Setting = app[settingsModule.config.mongooseId].model('Setting');

  express.get('/settings', express.crud.browseRoute.bind(null, app, Setting));
};
