// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const os = require('os');

exports.DEFAULT_CONFIG = {
  modbusId: 'modbus'
};

exports.start = function startHealthBackendModule(app, module)
{
  let modbus;
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

  app.onModuleReady(module.config.modbusId, function()
  {
    modbus = app[module.config.modbusId];

    sendMemoryData();
    sendUptimeAndLoadData();
  });

  /**
   * @private
   */
  function sendMemoryData()
  {
    modbus.tags[`${tagPrefix}.memory`].setValue(roundBytes(process.memoryUsage().rss));
    modbus.tags['health.os.memory'].setValue(roundBytes(os.totalmem() - os.freemem()));

    setTimeout(sendMemoryData, 1000);
  }

  /**
   * @private
   */
  function sendUptimeAndLoadData()
  {
    modbus.tags[`${tagPrefix}.uptime`].setValue(Math.round(process.uptime()));
    modbus.tags['health.os.uptime'].setValue(Math.round(os.uptime()));
    modbus.tags['health.os.cpu'].setValue(os.loadavg()[0]);

    setTimeout(sendUptimeAndLoadData, 60000);
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
