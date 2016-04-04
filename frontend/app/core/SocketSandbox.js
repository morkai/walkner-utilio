// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore'
], function(
  _
) {
  'use strict';

  /**
   * @constructor
   * @param {(Socket|SocketSandbox)} socket
   */
  function SocketSandbox(socket)
  {
    /**
     * @private
     * @type {(Socket|SocketSandbox)}
     */
    this.socket = socket;

    /**
     * @private
     * @type {Object}
     */
    this.listeners = {
      destroy: []
    };

    if (socket instanceof SocketSandbox)
    {
      var me = this;

      this.socket.on('destroy', function()
      {
        me.destroy();
      });
    }
  }

  SocketSandbox.prototype.destroy = function()
  {
    var allListeners = this.listeners;

    if (allListeners == null)
    {
      return;
    }

    var destroyListeners = allListeners.destroy;

    if (_.isArray(destroyListeners))
    {
      for (var i = 0, l = destroyListeners.length; i < l; ++i)
      {
        destroyListeners[i].call(this);
      }
    }

    delete this.listeners.destroy;

    var eventNames = Object.keys(allListeners);

    for (var j = 0, m = eventNames.length; j < m; ++j)
    {
      var eventName = eventNames[j];
      var listeners = allListeners[eventName];

      for (var k = 0, n = listeners.length; k < n; ++k)
      {
        this.socket.off(eventName, listeners[k]);
      }
    }

    this.listeners = null;
    this.socket = null;
  };

  /**
   * @returns {SocketSandbox}
   */
  SocketSandbox.prototype.sandbox = function()
  {
    return new SocketSandbox(this);
  };

  /**
   * @returns {?string}
   */
  SocketSandbox.prototype.getId = function()
  {
    return this.socket.getId();
  };

  /**
   * @returns {boolean}
   */
  SocketSandbox.prototype.isConnected = function()
  {
    return this.socket.isConnected();
  };

  /**
   * @param {string} eventName
   * @param {function} cb
   * @returns {SocketSandbox}
   */
  SocketSandbox.prototype.on = function(eventName, cb)
  {
    var listeners = this.listeners[eventName];

    if (_.isUndefined(listeners))
    {
      listeners = this.listeners[eventName] = [];
    }

    listeners.push(cb);

    if (eventName !== 'destroy')
    {
      this.socket.on(eventName, cb);
    }

    return this;
  };

  /**
   * @param {string} eventName
   * @param {function} [cb]
   * @returns {SocketSandbox}
   */
  SocketSandbox.prototype.off = function(eventName, cb)
  {
    var listeners = this.listeners[eventName];

    if (_.isUndefined(listeners))
    {
      return this;
    }

    if (_.isUndefined(cb))
    {
      delete this.listeners[eventName];
    }
    else
    {
      var pos = _.indexOf(listeners, cb);

      if (pos === -1)
      {
        return this;
      }

      listeners.splice(pos, 1);

      if (listeners.length === 0)
      {
        delete this.listeners[eventName];
      }
    }

    if (eventName !== 'destroy')
    {
      this.socket.off(eventName, cb);
    }

    return this;
  };

  /**
   * @param {string} eventName
   * @param {...*} argN
   * @returns {SocketSandbox}
   */
  SocketSandbox.prototype.emit = function(eventName, argN) // eslint-disable-line no-unused-vars
  {
    var args = Array.prototype.slice.call(arguments);
    var lastArgPos = args.length - 1;

    args[lastArgPos] = this.wrapCallback(args[lastArgPos]);

    this.socket.emit.apply(this.socket, args);

    return this;
  };

  /**
   * @param {Object} data
   * @param {function} [cb]
   * @returns {SocketSandbox}
   */
  SocketSandbox.prototype.send = function(data, cb)
  {
    this.socket.send(data, this.wrapCallback(cb));

    return this;
  };

  /**
   * @private
   * @param {*} cb
   * @returns {*}
   */
  SocketSandbox.prototype.wrapCallback = function(cb)
  {
    if (!_.isFunction(cb))
    {
      return cb;
    }

    var socketSandbox = this;

    return function wrappedCb()
    {
      if (socketSandbox.socket === null)
      {
        return;
      }

      cb.apply(this, arguments);
    };
  };

  return SocketSandbox;
});
