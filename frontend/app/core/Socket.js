// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/core/SocketSandbox'
], function(
  SocketSandbox
) {
  'use strict';

  /**
   * @constructor
   * @param {Object} sio
   */
  function Socket(sio)
  {
    /**
     * @private
     * @type {Object}
     */
    this.sio = sio;
  }

  /**
   * @returns {SocketSandbox}
   */
  Socket.prototype.sandbox = function()
  {
    return new SocketSandbox(this);
  };

  /**
   * @returns {?string}
   */
  Socket.prototype.getId = function()
  {
    return this.sio.id || null;
  };

  /**
   * @returns {boolean}
   */
  Socket.prototype.isConnected = function()
  {
    return this.sio.io.readyState === 'open';
  };

  /**
   * @returns {boolean}
   */
  Socket.prototype.isConnecting = function()
  {
    return this.sio.io.readyState === 'opening';
  };

  Socket.prototype.connect = function()
  {
    this.sio.open();
  };

  Socket.prototype.reconnect = function()
  {
    this.connect();
  };

  /**
   * @param {string} eventName
   * @param {function} cb
   * @returns {Socket}
   */
  Socket.prototype.on = function(eventName, cb)
  {
    this.sio.on(eventName, cb);

    return this;
  };

  /**
   * @param {string} eventName
   * @param {function} [cb]
   * @returns {Socket}
   */
  Socket.prototype.off = function(eventName, cb)
  {
    if (typeof cb === 'undefined')
    {
      this.sio.removeAllListeners(eventName);
    }
    else
    {
      this.sio.off(eventName, cb);
    }

    return this;
  };

  /**
   * @param {string} eventName
   * @param {...*} argN
   * @returns {Socket}
   */
  Socket.prototype.emit = function(eventName, argN) // eslint-disable-line no-unused-vars
  {
    this.sio.json.emit.apply(this.sio.json, arguments);

    return this;
  };

  /**
   * @param {Object} data
   * @param {function} [cb]
   * @returns {Socket}
   */
  Socket.prototype.send = function(data, cb)
  {
    this.sio.json.send(data, cb);

    return this;
  };

  return Socket;
});
