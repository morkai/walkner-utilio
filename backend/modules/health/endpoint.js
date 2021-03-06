// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const _ = require('lodash');

exports.DEFAULT_CONFIG = {
  messengerClientId: 'messenger/client',
  sioId: 'sio'
};

exports.start = function startHealthEndpointModule(app, module)
{
  let tagPrefix = 'health.';
  const idParts = app.options.id.split('-');

  if (idParts.length === 1)
  {
    tagPrefix += idParts[0];
  }
  else
  {
    idParts.shift();

    tagPrefix += idParts.join('_');
  }

  const scheduleSendSioData = _.throttle(sendSioData, 5000);
  let websockets = 0;
  let messengerClient;

  app.onModuleReady(module.config.messengerClientId, function()
  {
    messengerClient = app[module.config.messengerClientId];

    app.onModuleReady(module.config.sioId, setUpSioModule);

    sendMemoryData();
    sendUptimeData();
  });

  /**
   * @private
   */
  function setUpSioModule()
  {
    const sio = app[module.config.sioId];

    sio.on('connection', function(socket)
    {
      ++websockets;

      scheduleSendSioData();

      socket.on('disconnect', function()
      {
        --websockets;

        scheduleSendSioData();
      });
    });
  }

  /**
   * @private
   */
  function sendMemoryData()
  {
    messengerClient.request('modbus.setTagValue', {
      name: tagPrefix + '.memory',
      value: roundBytes(process.memoryUsage().rss)
    });

    setTimeout(sendMemoryData, 1000);
  }

  /**
   * @private
   */
  function sendUptimeData()
  {
    messengerClient.request('modbus.setTagValue', {
      name: tagPrefix + '.uptime',
      value: Math.round(process.uptime())
    });

    setTimeout(sendUptimeData, 60000);
  }

  /**
   * @private
   */
  function sendSioData()
  {
    messengerClient.request('modbus.setTagValue', {
      name: tagPrefix + '.websockets',
      value: websockets
    });
  }

  /**
   * @private
   * @param {number} bytes
   * @returns {number}
   */
  function roundBytes(bytes)
  {
    return Math.round(bytes / 1024 / 1024 * 1000) / 1000;
  }
};
