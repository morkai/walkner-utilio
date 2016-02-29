// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const _ = require('lodash');
const modbus = require('h5.modbus');
const iNodeModbus = require('h5.modbus.inode');

exports.DEFAULT_CONFIG = {
  connections: [],
  devices: [],
  listener: {}
};

exports.start = function startInodelanModule(app, module)
{
  module.gateway = new iNodeModbus.Gateway();

  module.slave = modbus.createSlave({
    listener: module.config.listener,
    requestHandler: module.gateway.handleModbusRequest
  });

  module.slave.listener.on('open', () => module.debug('[listener#open]'));
  module.slave.listener.on('close', () => module.debug('[listener#close]'));
  module.slave.listener.on('error', err => module.debug(`[listener#error] ${err.message}`));
  module.slave.listener.on('client', client => module.debug('[listener#client]', client.remoteInfo));

  _.forEach(module.config.connections, options =>
  {
    const id = options.id || `${options.socketOptions.host}:${options.socketOptions.port}`;
    const connection = modbus.createConnection(options);

    connection.on('open', () => module.debug(`[connection#${id}#open]`));
    connection.on('close', () => module.debug(`[connection#${id}#close]`));
    connection.on('error', (err) => module.debug(`[connection#${id}#error] ${err.message}`));

    module.gateway.addConnection(connection);

    module.info(`Added connection: ${id}`);
  });

  _.forEach(module.config.devices, options =>
  {
    const id = options.id || `${options.unit}@${options.mac}`;
    const device = new iNodeModbus.Device(options.mac, options.unit);

    module.gateway.addDevice(device);

    module.info(`Added device: ${id}`);
  });
};
