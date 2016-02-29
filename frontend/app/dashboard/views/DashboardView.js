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

    localTopics: {
      'socket.connected': 'load'
    },

    remoteTopics: {
      'controller.tagValuesChanged': 'updateTagValues',
      'controller.tagsChanged': 'updateTags'
    },

    initialize: function()
    {
      this.defineModels();
      this.defineViews();
      this.load();
    },

    defineModels: function()
    {
      this.tags = {};
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
        view.updateTags(res.collection);
      });
    },

    updateTags: function(tags)
    {
      var view = this;
      var changes = {};

      this.tags = {};

      _.forEach(tags, function(tag)
      {
        view.tags[tag.name] = tag;
        changes[tag.name] = tag.value;
      });

      this.updateTagValues(changes);
    },

    updateTagValues: function(changes)
    {
      var view = this;

      _.forEach(changes, function(value, tag)
      {
        tag = view.tags[tag];

        if (tag)
        {
          tag.value = value;

          view.updateTag(tag);
        }
      });
    },

    updateTag: function(tag)
    {
      var view = this;

      this.$('[data-tag="' + tag.name + '"]').each(function()
      {
        view.updateTagElement(this, tag);
      });
    },

    updateTagElement: function(tagEl, tag)
    {
      if (typeof tagEl.dataset.selectValue !== 'undefined')
      {
        return this.selectTagValue(tagEl, tag);
      }

      this.updateTagTextContent(tagEl, tag);
    },

    selectTagValue: function(tagEl, tag)
    {
      var $options = this.$(tagEl).find('[data-value]');

      $options.addClass('hidden').filter('[data-value="' + tag.value + '"]').removeClass('hidden');
    },

    updateTagTextContent: function(tagEl, tag)
    {
      tagEl.textContent = this.valueToString(tag.value);
    },

    valueToString: function(rawValue)
    {
      if (rawValue == null)
      {
        return '?';
      }

      if (typeof rawValue === 'boolean')
      {
        return rawValue ? '1' : '0';
      }

      if (typeof rawValue === 'number')
      {
        return (Math.round(rawValue * 100) / 100).toLocaleString();
      }

      return String(rawValue);
    }

  });
});
