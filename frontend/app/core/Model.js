// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'backbone'
], function(
  Backbone
) {
  'use strict';

  /**
   * @constructor
   * @extends {Backbone.Model}
   */
  function Model()
  {
    Backbone.Model.apply(this, arguments);
  }

  inherits(Model, Backbone.Model, {
    /**
     * @type {?string}
     */
    idAttribute: '_id',

    /**
     * @type {?string}
     */
    labelAttribute: null,

    /**
     * @type {string}
     */
    urlRoot: '/',

    /**
     * @type {?string}
     */
    clientUrlRoot: null,

    /**
     * @type {?string}
     */
    topicPrefix: null,

    /**
     * @type {?string}
     */
    privilegePrefix: null,

    /**
     * @type {?string}
     */
    nlsDomain: null,

    /**
     * @private
     * @type {?JQueryXHR}
     */
    currentReadRequest: null
  });

  /**
   * @param {string} [action]
   * @returns {?string}
   * @throws {Error} If the `clientUrlRoot` was not defined on the model.
   */
  Model.prototype.genClientUrl = function(action)
  {
    if (this.clientUrlRoot === null)
    {
      throw new Error('`clientUrlRoot` is not defined!');
    }

    var url = this.clientUrlRoot;

    if (action === 'base')
    {
      return url;
    }

    url += '/';

    if (this.isNew())
    {
      url += encodeURIComponent(this.cid);
    }
    else
    {
      url += encodeURIComponent(this.id);
    }

    if (typeof action === 'string')
    {
      url += ';' + action;
    }

    return url;
  };

  /**
   * @returns {?string}
   */
  Model.prototype.getTopicPrefix = function()
  {
    return this.topicPrefix;
  };

  /**
   * @returns {?string}
   */
  Model.prototype.getPrivilegePrefix = function()
  {
    return this.privilegePrefix;
  };

  /**
   * @returns {string}
   */
  Model.prototype.getNlsDomain = function()
  {
    return this.nlsDomain || 'core';
  };

  /**
   * @returns {string}
   */
  Model.prototype.getLabelAttribute = function()
  {
    return this.labelAttribute || this.idAttribute;
  };

  /**
   * @returns {string}
   */
  Model.prototype.getLabel = function()
  {
    return String(this.get(this.getLabelAttribute()));
  };

  /**
   * @param {string} method
   * @param {Model} model
   * @param {JQueryAjaxSettings} options
   * @returns {JQueryXHR}
   */
  Model.prototype.sync = function(method, model, options)
  {
    var read = method === 'read';

    if (read)
    {
      this.cancelCurrentReadRequest(model);
    }

    var req = Backbone.Model.prototype.sync.call(this, method, model, options);

    if (read)
    {
      this.setUpCurrentReadRequest(model, req);
    }

    return req;
  };

  /**
   * @private
   * @param {Model} model
   */
  Model.prototype.cancelCurrentReadRequest = function(model)
  {
    if (model.currentReadRequest)
    {
      model.currentReadRequest.abort();
      model.currentReadRequest = null;
    }
  };

  /**
   * @private
   * @param {Model} model
   * @param {JQueryXHR} req
   */
  Model.prototype.setUpCurrentReadRequest = function(model, req)
  {
    req.always(function onComplete()
    {
      if (model.currentReadRequest === req)
      {
        model.currentReadRequest = null;
      }
    });

    model.currentReadRequest = req;
  };

  return Model;
});
