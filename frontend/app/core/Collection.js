// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'backbone',
  'h5.rql/index',
  './PaginationData'
], function(
  _,
  Backbone,
  rql,
  PaginationData
) {
  'use strict';

  /**
   * @constructor
   * @template TModel
   * @extends {Backbone.Collection<TModel>}
   * @param {Array<(Object|TModel)>} [models]
   * @param {Object} [options]
   */
  function Collection(models, options)
  {
    if (!_.isObject(options))
    {
      options = {};
    }

    /**
     * @type {h5.rql.Query}
     */
    this.rqlQuery = this.createRqlQuery(options.rqlQuery || this.rqlQuery);

    /**
     * @type {?PaginationData}
     */
    this.paginationData = options.paginate !== false ? new PaginationData() : null;

    /**
     * @type {(string|function(): string|null)}
     */
    this.url = this.url || this.model.prototype.urlRoot;

    Backbone.Collection.call(this, models, options);

    if (this.paginationData)
    {
      this.listenTo(this.paginationData, 'change:page', this.onPageChanged);
    }
  }

  inherits(Collection, Backbone.Collection);

  /**
   * @param {*} res
   * @returns {Array}
   */
  Collection.prototype.parse = function(res)
  {
    if (this.paginationData)
    {
      this.paginationData.set(this.getPaginationData(res));
    }

    return Array.isArray(res.collection) ? res.collection : [];
  };

  /**
   * @param {string} type
   * @param {TModel} model
   * @param {JQueryAjaxSettings} options
   * @returns {JQueryXHR}
   */
  Collection.prototype.sync = function(type, model, options)
  {
    if (type === 'read' && !options.data)
    {
      options.data = this.rqlQuery.toString();
    }

    return Backbone.Collection.prototype.sync.call(this, type, model, options);
  };

  /**
   * @param {string} [action]
   * @returns {string}
   * @throws {Error} If the `clientUrlRoot` was not specified during definition.
   */
  Collection.prototype.genClientUrl = function(action)
  {
    if (this.model.prototype.clientUrlRoot === null)
    {
      throw new Error("Model's `clientUrlRoot` was not specified");
    }

    var url = this.model.prototype.clientUrlRoot;

    if (typeof action === 'string')
    {
      url += ';' + action;
    }

    return url;
  };

  /**
   * @returns {?string}
   */
  Collection.prototype.getTopicPrefix = function()
  {
    return this.topicPrefix || this.model.prototype.topicPrefix;
  };

  /**
   * @returns {?string}
   */
  Collection.prototype.getPrivilegePrefix = function()
  {
    return this.privilegePrefix || this.model.prototype.privilegePrefix;
  };

  /**
   * @returns {?string}
   */
  Collection.prototype.getNlsDomain = function()
  {
    return this.nlsDomain || this.model.prototype.nlsDomain;
  };

  /**
   * @param {string} modelId
   * @returns {?string}
   */
  Collection.prototype.getLabel = function(modelId)
  {
    var model = this.get(modelId);

    return model ? model.getLabel() : null;
  };

  /**
   * @param {{totalCount: number}} res
   * @returns {{totalCount: number, urlTemplate: string, skip: number, limit: number}}
   */
  Collection.prototype.getPaginationData = function(res)
  {
    return {
      totalCount: res.totalCount,
      urlTemplate: this.genPaginationUrlTemplate(),
      skip: this.rqlQuery.skip,
      limit: this.rqlQuery.limit
    };
  };

  /**
   * @private
   * @returns {string}
   */
  Collection.prototype.genPaginationUrlTemplate = function()
  {
    var rqlQuery = this.rqlQuery;
    var skip = rqlQuery.skip;
    var limit = rqlQuery.limit;

    rqlQuery.skip = '${skip}';
    rqlQuery.limit = '${limit}';

    var urlTemplate = this.genClientUrl() + '?' + rqlQuery.toString();

    rqlQuery.skip = skip;
    rqlQuery.limit = limit;

    return urlTemplate;
  };

  /**
   * @private
   * @param {*} rqlQuery
   * @returns {h5.rql.Query}
   */
  Collection.prototype.createRqlQuery = function(rqlQuery)
  {
    if (_.isString(rqlQuery))
    {
      rqlQuery = rql.parse(rqlQuery);
    }
    else if (_.isFunction(rqlQuery))
    {
      rqlQuery = rqlQuery.call(this, rql);
    }
    else if (_.isObject(rqlQuery))
    {
      rqlQuery = rql.Query.fromObject(rqlQuery);
    }

    if (rqlQuery && !rqlQuery.isEmpty())
    {
      return rqlQuery;
    }

    if (_.isString(this.rqlQuery))
    {
      return rql.parse(this.rqlQuery);
    }

    if (_.isFunction(this.rqlQuery))
    {
      return this.rqlQuery.call(this, rql);
    }

    if (_.isObject(this.rqlQuery))
    {
      return rql.Query.fromObject(this.rqlQuery);
    }

    return new rql.Query();
  };

  /**
   * @private
   * @param {Backbone.Model} model
   * @param {number} newPage
   */
  Collection.prototype.onPageChanged = function(model, newPage)
  {
    this.rqlQuery.skip = (newPage - 1) * this.rqlQuery.limit;

    this.fetch({reset: true});
  };

  return Collection;
});
