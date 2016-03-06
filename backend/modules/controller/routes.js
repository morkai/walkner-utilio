// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const _ = require('lodash');
const ObjectID = require('mongodb').ObjectID;
const step = require('h5.step');
const mongoSerializer = require('h5.rql/lib/serializers/mongoSerializer');

module.exports = function startControllerRoutes(app, module)
{
  var express = app[module.config.expressId];
  var mongoose = app[module.config.mongooseId];
  var user = app[module.config.userId];

  var canView = user.auth();

  express.get('/tags', canView, browseRoute);

  express.get('/tags/:tag/metric', canView, getTagMetricRoute);

  express.get('/tags/:tag/changes', canView, getTagChangesRoute);

  /**
   * @private
   * @param {Object} req
   * @param {Object} res
   */
  function browseRoute(req, res)
  {
    var tags = _.values(module.tags);

    res.send({
      totalCount: tags.length,
      collection: tags
    });
  }

  /**
   * @private
   * @param {Object} req
   * @param {Object} res
   * @param {function(?Error)} next
   */
  function getTagMetricRoute(req, res, next)
  {
    const tagName = req.params.tag;

    if (!_.isString(tagName) || tagName.length === 0)
    {
      next(new Error('UNKNOWN_TAG'));

      return;
    }

    let start = parseInt(req.query.start, 10);
    let stop = parseInt(req.query.stop, 10);
    let step = parseInt(req.query.step, 10);

    if (isNaN(stop) || stop < 0)
    {
      stop = Date.now();
    }

    if (isNaN(start) || start >= stop)
    {
      start = stop - 3600 * 1000;
    }

    if (isNaN(step) || step < 60000)
    {
      step = 60000;
    }

    const collection = mongoose.connection.db.collection(`tags.${tagName}.avg`);
    const query = {
      _id: {
        $gte: ObjectID.createFromTime(Math.round(start / 1000)),
        $lte: ObjectID.createFromTime(Math.round(stop / 1000))
      }
    };
    const valueField = mapValueField(req.query.valueField);
    const fields = {
      [valueField]: 1
    };

    collection.find(query, fields).toArray(function(err, docs)
    {
      if (err)
      {
        next(err);

        return;
      }

      res.send(prepareMetrics(docs, valueField, stop, step));
    });
  }

  /**
   * @private
   * @param {Object} req
   * @param {Object} res
   * @param {function(?Error)} next
   * @returns {undefined}
   */
  function getTagChangesRoute(req, res, next)
  {
    const tag = module.tags[req.params.tag];

    if (!tag)
    {
      return next(new Error('UNKNOWN_TAG'));
    }

    if (!tag.archive)
    {
      return next(new Error('TAG_NOT_ARCHIVED'));
    }

    const queryOptions = prepareChangesQueryOptions(req.rql, tag);
    const collectionName = tag.archive === 'all'
      ? 'tags.all'
      : `tags.${tag.name}.avg`;
    const collection = mongoose.connection.db.collection(collectionName);

    step(
      function countStep()
      {
        collection.count(queryOptions.selector, this.next());
      },
      function findStep(err, totalCount)
      {
        if (err)
        {
          return this.done(next, err);
        }

        this.totalCount = totalCount;

        if (totalCount > 0)
        {
          collection
            .find(queryOptions.selector, null, queryOptions)
            .toArray(this.next());
        }
      },
      function sendResponseStep(err, documents)
      {
        if (err)
        {
          return this.done(next, err);
        }

        var totalCount = this.totalCount;

        res.format({
          json: function()
          {
            res.json({
              totalCount: totalCount,
              collection: _.map(documents, function(document)
              {
                if (tag.archive === 'avg')
                {
                  document.t = document._id.getTimestamp().getTime();
                }

                document._id = undefined; // eslint-disable-line no-undefined

                return document;
              })
            });
          }
        });
      }
    );
  }

  /**
   * @private
   * @param {string} valueField
   * @returns {string}
   */
  function mapValueField(valueField)
  {
    switch (valueField)
    {
      case 'min':
      case 'n':
        return 'n';

      case 'max':
      case 'x':
        return 'x';

      default:
        return 'v';
    }
  }

  /**
   * @private
   * @param {Array<Object>} docs
   * @param {string} valueField
   * @param {number} stop
   * @param {number} step
   * @returns {Array<?number>}
   */
  function prepareMetrics(docs, valueField, stop, step)
  {
    if (docs.length === 0)
    {
      return [];
    }

    const metrics = [];
    let prevDocTime = null;
    let prevValue = null;

    for (var i = 0, l = docs.length; i < l; ++i)
    {
      const doc = docs[i];
      const docTime = doc._id.getTimestamp().getTime();

      if (prevDocTime !== null)
      {
        let missingMiddleMetrics = Math.ceil((docTime - prevDocTime) / step) - 1;

        if (missingMiddleMetrics > 0)
        {
          while (missingMiddleMetrics--)
          {
            metrics.push(null);
          }
        }
      }

      prevDocTime = docTime;
      prevValue = doc[valueField];

      metrics.push(prevValue);
    }

    const lastMetricTime = docs[docs.length - 1]._id.getTimestamp().getTime();
    const missingRightMetrics = Math.ceil((stop - lastMetricTime) / step) - 1;

    for (let j = 1; j < missingRightMetrics; ++j)
    {
      metrics.push(null);
    }

    return metrics;
  }

  /**
   * @private
   * @param {h5.rql.Query} rql
   * @param {Object} tag
   * @returns {Object}
   */
  function prepareChangesQueryOptions(rql, tag)
  {
    const queryOptions = mongoSerializer.fromQuery(rql);

    if (tag.archive === 'all')
    {
      queryOptions.selector.n = tag.name;
      queryOptions.fields = {t: 1, v: 1};
      queryOptions.sort = {t: -1};
    }
    else
    {
      queryOptions.fields = {s: 1, n: 1, x: 1, v: 1};
      queryOptions.sort = {_id: -1};

      const t = queryOptions.selector.t;

      if (typeof t === 'object')
      {
        queryOptions.selector._id = {};

        Object.keys(t).forEach(function(op)
        {
          var value = t[op];

          if (typeof value !== 'number' || !_.includes(['$gt', '$gte', '$lt', '$lte'], op))
          {
            return;
          }

          queryOptions.selector._id[op] = ObjectID.createFromTime(Math.round(value / 1000));
        });

        delete queryOptions.selector.t;
      }
    }

    return queryOptions;
  }
};
