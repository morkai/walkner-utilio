// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  '../broker',
  '../pubsub',
  '../tags/TagCollection'
], function(
  _,
  $,
  broker,
  pubsub,
  TagCollection
) {
  'use strict';

  var pendingChanges = [];
  var tags = new TagCollection(JSON.parse(localStorage.TAGS || '[]'), {paginate: false});

  tags.loaded = false;
  tags.loading = null;
  tags.load = function()
  {
    if (tags.loaded)
    {
      return $.Deferred().resolve().promise(); // eslint-disable-line new-cap
    }

    if (tags.loading)
    {
      return tags.loading;
    }

    return load();
  };

  function load()
  {
    if (tags.loading)
    {
      return;
    }

    tags.loading = $.ajax({
      url: _.result(tags, 'url')
    });

    tags.loading.done(function(res)
    {
      reset(res.collection);
    });

    tags.loading.always(function()
    {
      tags.loading = null;
    });

    return tags.loading;
  }

  function reset(newTags)
  {
    tags.loaded = true;

    var changes = {};
    var silent = {silent: true};

    _.forEach(newTags, function(newTag)
    {
      var oldTag = tags.get(newTag.name);
      var oldValue;

      if (oldTag)
      {
        oldValue = oldTag.get('value');
        oldTag.set(newTag, silent);
      }
      else
      {
        tags.add(newTag, silent);
      }

      if (newTag.value !== oldValue)
      {
        changes[newTag.name] = newTag.value;
      }
    });

    _.forEach(pendingChanges, function(pendingChange)
    {
      var changeTime = pendingChange.time;

      _.forEach(pendingChanges.newValues, function(newValue, tagName)
      {
        var tag = tags.get(tagName);

        if (tag && changeTime > tag.get('lastChangeTime'))
        {
          tag.set({
            lastChangeTime: changeTime,
            value: newValue
          }, silent);

          changes[tagName] = newValue;
        }
      });
    });

    pendingChanges = [];

    localStorage.TAGS = JSON.stringify(tags);

    tags.trigger('reset');

    if (!_.isEmpty(changes))
    {
      broker.publish('controller.valuesChanged', changes);
    }
  }

  broker.subscribe('socket.connected', load);

  pubsub.subscribe('controller.tagsChanged', reset);

  pubsub.subscribe('controller.tagValuesChanged', function(newValues)
  {
    if (tags.loading)
    {
      pendingChanges.push({
        time: newValues['@timestamp'],
        newValues: newValues
      });

      return;
    }

    var changes = {};

    _.forEach(newValues, function(newValue, tagName)
    {
      var tag = tags.get(tagName);

      if (tag && newValue !== tag.get('value'))
      {
        tag.set('value', newValue);
        changes[tagName] = newValue;
      }
    });

    if (!_.isEmpty(changes))
    {
      broker.publish('controller.valuesChanged', changes);
    }
  });

  return tags;
});
