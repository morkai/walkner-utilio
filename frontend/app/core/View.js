// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  'backbone.layout',
  'app/broker',
  'app/socket',
  'app/pubsub',
  'app/core/util'
],
function(
  _,
  $,
  Layout,
  broker,
  socket,
  pubsub,
  util
) {
  'use strict';

  /**
   * @constructor
   * @extends {Backbone.Layout}
   * @extends {Backbone.Events}
   * @param {Object} options
   */
  function View(options)
  {
    /**
     * @protected
     * @type {string}
     */
    this.idPrefix = _.uniqueId('v');

    /**
     * @protected
     * @type {Object}
     */
    this.options = options || {};

    /**
     * @protected
     * @type {Object<string, number>}
     */
    this.timers = {};

    /**
     * @protected
     * @type {Array<{always: function, abort: function}>}
     */
    this.promises = [];

    /**
     * @protected
     * @property
     * @name broker
     * @memberOf View#
     * @type {h5.pubsub.Sandbox}
     */
    util.defineSandboxedProperty(this, 'broker', broker);

    /**
     * @protected
     * @property
     * @name pubsub
     * @memberOf View#
     * @type {h5.pubsub.Sandbox}
     */
    util.defineSandboxedProperty(this, 'pubsub', pubsub);

    /**
     * @protected
     * @property
     * @name socket
     * @memberOf View#
     * @type {SocketSandbox}
     */
    util.defineSandboxedProperty(this, 'socket', socket);

    if (typeof this.bindThis === 'string')
    {
      this[this.bindThis] = this[this.bindThis].bind(this);
    }
    else
    {
      _.forEach(this.bindThis, function(func) { this[func] = this[func].bind(this); }, this);
    }

    Layout.call(this, options);

    util.subscribeTopics(this, 'broker', this.localTopics, true);
    util.subscribeTopics(this, 'pubsub', this.remoteTopics, true);
  }

  inherits(View, Layout, {

    /**
     * @type {?(Object<string, (string|function)>|function)}
     */
    localTopics: null,

    /**
     * @type {?(Object<string, (string|function)>|function)}
     */
    remoteTopics: null,

    /**
     * @type {?(string|Array<string>)}
     */
    bindThis: null

  });

  /**
   * @protected
   * @param {(Object|function)} events
   * @returns {View}
   */
  View.prototype.delegateEvents = function(events)
  {
    var view = this;

    if (!events)
    {
      events = _.result(view, 'events');
    }

    if (!events)
    {
      return view;
    }

    view.undelegateEvents();

    _.forEach(events, function(method, key)
    {
      if (!_.isFunction(method))
      {
        method = view[method];
      }

      if (!_.isFunction(method))
      {
        return;
      }

      var match = key.match(/^(\S+)\s*(.*)$/);
      var eventName = match[1] + '.delegateEvents' + view.cid;
      var selector = match[2];

      if (selector === '')
      {
        view.$el.on(eventName, method.bind(view));
      }
      else
      {
        if (_.isString(view.idPrefix))
        {
          selector = selector.replace(/#-/g, '#' + view.idPrefix + '-');
        }

        view.$el.on(eventName, selector, method.bind(view));
      }
    });
  };

  View.prototype.cleanup = function()
  {
    this.destroy();
    this.cleanupSelect2();

    util.cleanupSandboxedProperties(this);

    if (_.isObject(this.timers))
    {
      _.forEach(this.timers, clearTimeout);

      this.timers = null;
    }

    this.cancelRequests();
  };

  View.prototype.destroy = function() {};

  View.prototype.cleanupSelect2 = function()
  {
    var view = this;

    this.$('.select2-container').each(function()
    {
      view.$('#' + this.id.replace('s2id_', '')).select2('destroy');
    });
  };

  View.prototype.beforeRender = function() {};

  View.prototype.afterRender = function() {};

  /**
   * @returns {Object}
   */
  View.prototype.serialize = function()
  {
    return {
      idPrefix: this.idPrefix
    };
  };

  /**
   * @returns {boolean}
   */
  View.prototype.isRendered = function()
  {
    return this.hasRendered === true;
  };

  /**
   * @returns {boolean}
   */
  View.prototype.isDetached = function()
  {
    return !$.contains(document.documentElement, this.el);
  };

  /**
   * @param {jQueryAjaxSettings} options
   * @returns {jQuery.jqXHR}
   */
  View.prototype.ajax = function(options)
  {
    return this.promised($.ajax(options));
  };

  /**
   * @param {jQuery.jqXHR} promise
   * @returns {jQuery.jqXHR}
   */
  View.prototype.promised = function(promise)
  {
    if (!promise || !_.isFunction(promise.abort))
    {
      return promise;
    }

    this.promises.push(promise);

    var view = this;

    promise.always(function()
    {
      if (Array.isArray(view.promises))
      {
        view.promises.splice(view.promises.indexOf(promise), 1);
      }
    });

    return promise;
  };

  View.prototype.cancelRequests = function()
  {
    _.forEach(this.promises, function(promise)
    {
      promise.abort();
    });

    this.promises = [];
  };

  /**
   * @param {boolean} [clearQueue=true]
   * @param {boolean} [jumpToEnd=true]
   */
  View.prototype.cancelAnimations = function(clearQueue, jumpToEnd)
  {
    this.$(':animated').stop(clearQueue !== false, jumpToEnd !== false);
  };

  /**
   * @param {string} idSuffix
   * @returns {jQuery}
   */
  View.prototype.$id = function(idSuffix)
  {
    var id = '#';

    if (_.isString(this.idPrefix))
    {
      id += this.idPrefix + '-';
    }

    return this.$(id + idSuffix);
  };

  return View;
});
