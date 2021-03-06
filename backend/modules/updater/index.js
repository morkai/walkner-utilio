// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

var fs = require('fs');
var _ = require('lodash');
var setUpRoutes = require('./routes');
var setUpCommands = require('./commands');
var expressMiddleware = require('./expressMiddleware');

exports.DEFAULT_CONFIG = {
  expressId: 'express',
  sioId: 'sio',
  packageJsonPath: 'package.json',
  versionsKey: 'wmes',
  backendVersionKey: 'backend',
  frontendVersionKey: 'frontend',
  manifestPath: null,
  restartDelay: 15000,
  errorTemplate: 'error503',
  pull: {
    exe: 'git',
    cwd: process.cwd(),
    timeout: 60000
  },
  manifests: []
};

exports.start = function startUpdaterModule(app, module)
{
  var reloadTimer = null;
  var restartTimer = null;

  module.config.packageJsonPath = require.resolve(module.config.packageJsonPath);

  module.package = reloadPackageJson();

  module.restarting = 0;

  module.manifest = module.config.manifestPath ? fs.readFileSync(module.config.manifestPath, 'utf8') : null;

  module.getVersions = function(clone)
  {
    if (!module.package.updater)
    {
      module.package.updater = {};
    }

    var updater = module.package.updater;
    var versionsKey = module.config.versionsKey;

    if (!updater[versionsKey])
    {
      updater[versionsKey] = {};
      updater[versionsKey][module.config.backendVersionKey] = -1;
      updater[versionsKey][module.config.frontendVersionKey] = -1;
    }

    updater[versionsKey].package = module.package.version;

    return clone === false ? updater[versionsKey] : _.cloneDeep(updater[versionsKey]);
  };

  module.getBackendVersion = function()
  {
    return module.getVersions(false)[module.config.backendVersionKey];
  };

  module.getFrontendVersion = function()
  {
    return module.getVersions(false)[module.config.frontendVersionKey];
  };

  module.updateFrontendVersion = function()
  {
    module.getVersions(false)[module.config.frontendVersionKey] = Date.now();
  };

  app.broker
    .subscribe('express.beforeMiddleware')
    .setLimit(1)
    .on('message', function(message)
    {
      var expressModule = message.module;
      var expressApp = expressModule.app;

      expressApp.use(expressMiddleware.bind(null, app, module));
    });

  app.onModuleReady(module.config.expressId, setUpRoutes.bind(null, app, module));

  app.onModuleReady(module.config.sioId, setUpCommands.bind(null, app, module));

  fs.watch(module.config.packageJsonPath, function()
  {
    if (reloadTimer !== null)
    {
      clearTimeout(reloadTimer);
    }

    reloadTimer = setTimeout(compareVersions, 1000);
  });

  function reloadPackageJson()
  {
    delete require.cache[module.config.packageJsonPath];

    module.package = require(module.config.packageJsonPath);

    return module.package;
  }

  function compareVersions()
  {
    reloadTimer = null;

    var oldBackendVersion = module.getBackendVersion();
    var oldFrontendVersion = module.getFrontendVersion();

    reloadPackageJson();

    var newBackendVersion = module.getBackendVersion();
    var newFrontendVersion = module.getFrontendVersion();

    if (newBackendVersion !== oldBackendVersion)
    {
      module.info(
        "Backend version changed from [%s] to [%s]...",
        oldBackendVersion,
        newBackendVersion
      );

      handleBackendUpdate(oldBackendVersion, newBackendVersion);
    }
    else if (newFrontendVersion !== oldFrontendVersion)
    {
      module.info(
        "Frontend version changed from [%s] to [%s]...",
        oldFrontendVersion,
        newFrontendVersion
      );

      handleFrontendUpdate(oldFrontendVersion, newFrontendVersion);
    }
  }

  function handleBackendUpdate(oldBackendVersion, newBackendVersion)
  {
    if (restartTimer !== null)
    {
      return;
    }

    module.restarting = Date.now();

    module.info("Restarting in %d seconds...", module.config.restartDelay / 1000);

    restartTimer = setTimeout(restart, module.config.restartDelay);

    app.broker.publish('updater.newVersion', {
      service: 'backend',
      oldVersion: oldBackendVersion,
      newVersion: newBackendVersion,
      delay: module.config.restartDelay
    });

    app.broker.publish('updater.restarting');
  }

  function handleFrontendUpdate(oldFrontendVersion, newFrontendVersion)
  {
    app.broker.publish('updater.newVersion', {
      service: 'frontend',
      oldVersion: oldFrontendVersion,
      newVersion: newFrontendVersion
    });
  }

  function restart()
  {
    module.info("Exiting the process...");

    setImmediate(process.exit.bind(process));
  }
};
