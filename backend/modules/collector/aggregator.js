// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const _ = require('lodash');
const ObjectID = require('mongodb').ObjectID;
const step = require('h5.step');

module.exports = function setUpAggregator(app, module)
{
  /**
   * @private
   * @type {Object<string, Tag>}
   */
  const tags = app[module.config.modbusId].tags;

  /**
   * @private
   * @type {Array<string>}
   */
  const avgTagNames = getAvgTagNames();

  /**
   * @private
   * @type {function(string): Collection}
   */
  const collection = module.config.collection;

  /**
   * @private
   * @type {Array<TagInfo>}
   */
  let collectorInfo = [];

  step(
    function ensureIndexesStep()
    {
      ensureIndex(collection('tags.avg.hourly'), this.parallel());
      ensureIndex(collection('tags.avg.daily'), this.parallel());
      ensureIndex(collection('tags.avg.monthly'), this.parallel());
    },
    function fetchCollectorInfoStep()
    {
      collection('collectorInfo').find({_id: {$in: avgTagNames}}).toArray(this.next());
    },
    function prefillCollectorInfoStep(err, rawCollectorInfo)
    {
      if (err)
      {
        module.error(`Failed to fetch collector info: ${err.message}`);

        return this.done(null);
      }

      var existingTagNames = _.map(rawCollectorInfo, '_id');
      var missingTagNames = _.without.apply(null, [avgTagNames].concat(existingTagNames));

      collectorInfo = rawCollectorInfo;

      _.forEach(missingTagNames, function(missingTagName)
      {
        collectorInfo.push({
          _id: missingTagName,
          lastHourly: 0,
          lastDaily: 0,
          lastMonthly: 0
        });
      });

      setImmediate(this.next());
    },
    function aggregateMissingDataStep()
    {
      _.forEach(collectorInfo, tagInfo => aggregateMissingTagData(tagInfo, this.parallel()));
    },
    function scheduleNextAggregationStep(err)
    {
      if (err)
      {
        module.error(`Failed to aggregate data: ${err.message}`);
      }

      scheduleNextAggregation();
    }
  );

  /**
   * @private
   * @param {Collection} levelCollection
   * @param {function} done
   */
  function ensureIndex(levelCollection, done)
  {
    const options = {unique: true, dropDups: true};

    levelCollection.ensureIndex({tag: 1, time: 1}, options, function(err)
    {
      if (err)
      {
        module.error(`Failed to ensure indexes for collection [${levelCollection.name}]: ${err.message}`);
      }

      done();
    });
  }

  /**
   * @private
   * @returns {Array<string>}
   */
  function getAvgTagNames()
  {
    const tagNames = [];

    _.forEach(tags, function(tag, tagName)
    {
      if (tag.archive === 'avg' && tag.kind !== 'setting')
      {
        tagNames.push(tagName);
      }
    });

    return tagNames;
  }

  /**
   * @private
   * @param {TagInfo} tagInfo
   * @param {function(?Error)} done
   */
  function aggregateMissingTagData(tagInfo, done)
  {
    const steps = [];

    const currentHourly = resetDate(new Date(), false, false);
    const lastHourly = resetDate(new Date(tagInfo.lastHourly), false, false);

    if (lastHourly < currentHourly)
    {
      steps.push(_.partial(aggregateHourlyDataStep, tagInfo, currentHourly));
    }

    const currentDaily = resetDate(new Date(), true, false);
    const lastDaily = resetDate(new Date(tagInfo.lastDaily), true, false);

    if (lastDaily < currentDaily)
    {
      steps.push(_.partial(aggregateDailyDataStep, tagInfo, currentDaily));
    }

    const currentMonthly = resetDate(new Date(), true, true);
    const lastMonthly = resetDate(new Date(tagInfo.lastMonthly), true, true);

    if (lastMonthly < currentMonthly)
    {
      steps.push(_.partial(aggregateMonthlyDataStep, tagInfo, currentMonthly));
    }

    steps.push(done);

    step(steps);
  }

  /**
   * @private
   * @param {TagInfo} tagInfo
   * @param {Date} currentMonthly
   * @param {?Error} err
   * @returns {undefined}
   */
  function aggregateMonthlyDataStep(tagInfo, currentMonthly, err)
  {
    if (err)
    {
      return this.skip(err);
    }

    const options = {
      from: tagInfo.lastMonthly,
      to: currentMonthly.getTime(),
      tag: tagInfo._id,
      srcCollectionName: 'tags.avg.daily',
      dstCollectionName: 'tags.avg.monthly',
      dstTimeProperty: 'lastMonthly',
      resetDate: _.partialRight(resetDate, true, true)
    };

    aggregateAndSaveData(options, this.next());
  }

  /**
   * @private
   * @param {TagInfo} tagInfo
   * @param {Date} currentDaily
   * @param {?Error} err
   * @returns {undefined}
   */
  function aggregateDailyDataStep(tagInfo, currentDaily, err)
  {
    if (err)
    {
      return this.skip(err);
    }

    const options = {
      from: tagInfo.lastDaily,
      to: currentDaily.getTime(),
      tag: tagInfo._id,
      srcCollectionName: 'tags.avg.hourly',
      dstCollectionName: 'tags.avg.daily',
      dstTimeProperty: 'lastDaily',
      resetDate: _.partialRight(resetDate, true, false)
    };

    aggregateAndSaveData(options, this.next());
  }

  /**
   * @private
   * @param {TagInfo} tagInfo
   * @param {Date} currentHourly
   * @param {?Error} err
   * @returns {undefined}
   */
  function aggregateHourlyDataStep(tagInfo, currentHourly, err)
  {
    if (err)
    {
      return this.skip(err);
    }

    currentHourly = currentHourly.getTime();

    const done = _.once(this.next());
    const selector = {
      _id: {
        $gte: ObjectID.createFromTime(Math.floor(tagInfo.lastHourly / 1000)),
        $lt: ObjectID.createFromTime(Math.floor(currentHourly / 1000))
      }
    };
    const fields = {
      _id: 1,
      c: 1,
      s: 1,
      v: 1,
      n: 1,
      x: 1
    };
    const options = {
      sort: '_id'
    };
    const cursor = collection(`tags.${tagInfo._id}.avg`).find(selector, fields, options);
    const averagedSrcDocs = [];
    const resetHourlyDate = _.partialRight(resetDate, false, false);

    cursor.each(function(err, minuteData)
    {
      if (err)
      {
        return done(err);
      }

      if (minuteData === null)
      {
        const groupedDocs = groupDocs(averagedSrcDocs, resetHourlyDate);
        const averagedDstDocs = averageGroupedDocs(groupedDocs, tagInfo._id);

        return saveAveragedDocs('tags.avg.hourly', 'lastHourly', currentHourly, averagedDstDocs, done);
      }

      averagedSrcDocs.push({
        tag: tagInfo._id,
        time: minuteData._id.getTimestamp().getTime(),
        count: minuteData.c,
        sum: minuteData.s,
        min: minuteData.n,
        max: minuteData.x,
        avg: minuteData.v
      });
    });
  }

  /**
   * @private
   * @param {AggregateDataOptions} options
   * @param {function(?Error)} done
   */
  function aggregateAndSaveData(options, done)
  {
    const selector = {
      tag: options.tag,
      time: {
        $gte: options.from,
        $lt: options.to
      }
    };
    const cursor = collection(options.srcCollectionName).find(selector, null, {sort: 'time'});

    cursor.toArray(function(err, averagedSrcDocs)
    {
      if (err)
      {
        return done(err);
      }

      if (averagedSrcDocs.length === 0)
      {
        return done(null);
      }

      const groupedDocs = groupDocs(averagedSrcDocs, options.resetDate);
      const averagedDstDocs = averageGroupedDocs(groupedDocs, options.tag);

      saveAveragedDocs(
        options.dstCollectionName,
        options.dstTimeProperty,
        options.to,
        averagedDstDocs,
        done
      );
    });
  }

  /**
   * @param {Array<AveragedDoc>} docs
   * @param {function(Date): Date} resetDate
   * @returns {Array<GroupedDocs>}
   */
  function groupDocs(docs, resetDate)
  {
    const results = [];
    let lastTime = 0;

    _.forEach(docs, function(doc)
    {
      const time = resetDate(new Date(doc.time)).getTime();

      if (time > lastTime)
      {
        lastTime = time;

        results.push({
          lastTime: lastTime,
          docs: []
        });
      }

      results[results.length - 1].docs.push(doc);
    });

    return results;
  }

  /**
   * @private
   * @param {Array<Object>} groupedDocs
   * @param {string} tagName
   * @returns {Array<AveragedDoc>}
   */
  function averageGroupedDocs(groupedDocs, tagName)
  {
    const results = [];

    _.forEach(groupedDocs, function(group)
    {
      const result = {
        tag: tagName,
        time: group.lastTime,
        min: +Infinity,
        max: -Infinity,
        avg: 0
      };
      let sum = 0;

      _.forEach(group.docs, function(doc)
      {
        if (doc.min < result.min)
        {
          result.min = doc.min;
        }

        if (doc.max > result.max)
        {
          result.max = doc.max;
        }

        sum += doc.avg;
      });

      result.avg = Math.round((sum / group.docs.length) * 100) / 100;

      results.push(result);
    });

    return results;
  }

  /**
   * @private
   * @param {string} collectionName
   * @param {string} timeProperty
   * @param {number} newTime
   * @param {Array<AveragedDoc>} averagedDocs
   * @param {function(?Error)} done
   * @returns {undefined}
   */
  function saveAveragedDocs(collectionName, timeProperty, newTime, averagedDocs, done)
  {
    if (!averagedDocs.length)
    {
      return done();
    }

    collection(collectionName).insert(averagedDocs, function(err)
    {
      if (err)
      {
        return done(err);
      }

      const tagName = averagedDocs[averagedDocs.length - 1].tag;
      const tagInfo = _.find(collectorInfo, {_id: tagName});
      const oldTime = tagInfo[timeProperty];

      tagInfo[timeProperty] = newTime;

      collection('collectorInfo').save(tagInfo, function(err)
      {
        if (err)
        {
          tagInfo[timeProperty] = oldTime;
        }

        done(err);
      });
    });
  }

  /**
   * @private
   */
  function scheduleNextAggregation()
  {
    const nextAggregationTime = +resetDate(new Date(), false, false) + 3660 * 1000;
    const nextAggregationDelay = nextAggregationTime - Date.now();
    const steps = [];

    _.forEach(collectorInfo, function(tagInfo)
    {
      steps.push(function(err)
      {
        if (err)
        {
          module.error(`Failed to aggregate data: ${err.message}`);
        }

        aggregateMissingTagData(tagInfo, this.next());
      });
    });

    steps.push(function(err)
    {
      if (err)
      {
        module.error(`Failed to aggregate data: ${err.message}`);
      }
    });

    steps.push(scheduleNextAggregation);

    app.timeout(nextAggregationDelay, _.partial(step, steps));
  }

  /**
   * @private
   * @param {Date} date
   * @param {boolean} resetHour
   * @param {boolean} resetDay
   * @returns {Date}
   */
  function resetDate(date, resetHour, resetDay)
  {
    if (resetDay)
    {
      date.setDate(1);
    }

    if (resetHour)
    {
      date.setHours(0);
    }

    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date;
  }

  /**
   * @typedef {Object} TagInfo
   * @property {string} _id
   * @property {number} lastHourly
   * @property {number} lastDaily
   * @property {number} lastMonthly
   */

  /**
   * @typedef {Object} AveragedDoc
   * @property {string} tag
   * @property {number} time
   * @property {number} min
   * @property {number} max
   * @property {number} avg
   */

  /**
   * @typedef {Object} GroupedDocs
   * @property {number} lastTime
   * @property {Array<AveragedDoc>} docs
   */

  /**
   * @typedef {Object} AggregateDataOptions
   * @property {number} from
   * @property {number} to
   * @property {string} tag
   * @property {string} srcCollectionName
   * @property {string} dstCollectionName
   * @property {string} dstTimeProperty
   * @property {function(Date): Date} resetDate
   */
};

/*
db.tags.outputPumps.current.avg.aggregate(
  {
    $match: {
      _id: {
        $gte: ObjectId("52629e700000000000000000"),
        $lt: ObjectId("5262ac800000000000000000")
      }
    }
  },
  {
    $project: {_id: 0, min: "$n", max: "$x", avg: "$v"}
  },
  {
    $group: {
      _id: null,
      min: {$min: "$min"},
      max: {$max: "$max"},
      avg: {$avg: "$avg"}
    }
  }
);
*/
