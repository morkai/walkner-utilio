// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

var setUpRoutes = require('./routes');

exports.DEFAULT_CONFIG = {
  expressId: 'express'
};

exports.start = function startPermalinksModule(app, module)
{
  var config = module.config;

  app.onModuleReady(
    [
      config.expressId
    ],
    setUpRoutes.bind(null, app, module)
  );
};
