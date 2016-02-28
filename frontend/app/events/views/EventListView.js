// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'app/time',
  'app/i18n',
  'app/core/views/ListView',
  'app/events/templates/list'
], function(
  _,
  time,
  t,
  ListView,
  listTemplate
) {
  'use strict';

  return ListView.extend({

    template: listTemplate,

    remoteTopics: {
      'events.saved': 'refreshCollection'
    },

    serialize: function()
    {
      var view = this;

      return {
        events: this.collection.map(function(event)
        {
          var type = event.get('type');
          var data = view.prepareData(type, event.get('data'));

          return {
            severity: event.getSeverityClassName(),
            time: time.format(event.get('time'), 'lll'),
            user: event.get('user'),
            type: t('events', 'TYPE:' + type),
            text: t('events', 'TEXT:' + type, view.flatten(data))
          };
        })
      };
    },

    refreshCollection: function(events, force)
    {
      if (typeof this.options.filter === 'function'
        && Array.isArray(events)
        && !events.some(this.options.filter))
      {
        return null;
      }

      return ListView.prototype.refreshCollection.call(this, events, force);
    },

    prepareData: function(type, data)
    {
      if (data.$prepared)
      {
        return data;
      }

      data.$prepared = true;

      if (data.date)
      {
        data.date = time.format(data.date, 'YYYY-MM-DD');
      }

      if (data.timestamp)
      {
        data.timestamp = time.format(data.timestamp, 'YYYY-MM-DD, HH:mm:ss');
      }

      switch (type) // eslint-disable-line no-empty
      {

      }

      return data;
    },

    flatten: function(obj)
    {
      var result = {};

      if (obj == null)
      {
        return result;
      }

      var keys = Object.keys(obj);

      for (var i = 0, l = keys.length; i < l; ++i)
      {
        var key = keys[i];
        var value = obj[key];

        if (value !== null && typeof value === 'object')
        {
          var flatObj = this.flatten(value);
          var flatKeys = Object.keys(flatObj);

          for (var ii = 0, ll = flatKeys.length; ii < ll; ++ii)
          {
            result[key + '->' + flatKeys[ii]] = String(flatObj[flatKeys[ii]]);
          }
        }
        else
        {
          result[key] = _.escape(String(value));
        }
      }

      return result;
    }

  });
});
