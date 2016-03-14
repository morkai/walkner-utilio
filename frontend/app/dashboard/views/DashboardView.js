// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'app/i18n',
  'app/user',
  'app/core/Model',
  'app/core/View',
  'app/data/controller',
  'app/dashboard/templates/dashboard'
], function(
  _,
  t,
  user,
  Model,
  View,
  controller,
  template
) {
  'use strict';

  return View.extend({

    template: template,

    localTopics: {
      'controller.valuesChanged': 'updateTagValues'
    },

    afterRender: function()
    {
      controller.forEach(this.updateTag, this);
    },

    updateTagValues: function(changes)
    {
      var view = this;

      _.forEach(changes, function(value, tag)
      {
        view.updateTag(controller.get(tag));
      });
    },

    updateTag: function(tag)
    {
      var view = this;

      this.$('[data-tag="' + tag.id + '"]').each(function()
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

      $options.addClass('hidden').filter('[data-value="' + tag.get('value') + '"]').removeClass('hidden');
    },

    updateTagTextContent: function(tagEl, tag)
    {
      tagEl.textContent = this.valueToString(tag.get('value'));
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
