// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'app/i18n',
  'app/user',
  'app/core/Model',
  'app/core/View',
  'app/dashboard/templates/dashboard'
], function(
  _,
  t,
  user,
  Model,
  View,
  template
) {
  'use strict';

  return View.extend({

    template: template,

    events: {

    },

    remoteTopics: {
      'controller.tagValuesChanged': 'updateTags'
    },

    initialize: function()
    {
      this.defineModels();
      this.defineViews();

      this.load();
    },

    defineModels: function()
    {

    },

    defineViews: function()
    {

    },

    load: function()
    {
      var view = this;
      var req = view.ajax({
        url: '/tags'
      });

      req.done(function(res)
      {
        var changes = {};

        _.forEach(res.collection, function(tag)
        {
          changes[tag.name] = tag.value;
        });

        view.updateTags(changes);
      });
    },

    updateTags: function(changes)
    {
      var view = this;

      _.forEach(changes, function(value, tagId)
      {
        view.$('span[data-tag="' + tagId + '"]').text(value);
      });

      if (changes['b41.T'] != null)
      {
        this.updateT('b41.T', changes['b41.T']);
      }

      if (changes['pl.T'] != null)
      {
        this.updateT('pl.T', changes['b41.T']);
      }
    },

    updateT: function(tagId, value)
    {
      var $thermometer = this.$('.de[data-tag="' + tagId + '"]');

      if (!$thermometer.length)
      {
        return;
      }

      var parts = value.toFixed(1).split('.');

      $thermometer.find('.integer').text(parts[0]);
      $thermometer.find('.decimal').text('.' + parts[1]);
    }

  });
});
