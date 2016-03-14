// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/core/util/fixTimeRange',
  'app/core/util/idAndLabel',
  'app/core/views/FilterView',
  'app/data/controller',
  'app/analytics/templates/chartsFilter'
], function(
  fixTimeRange,
  idAndLabel,
  FilterView,
  controller,
  template
) {
  'use strict';

  return FilterView.extend({

    template: template,

    defaultFormData: function()
    {
      return {
        from: '',
        to: '',
        tag: ''
      };
    },

    termToForm: {
      'time': function(propertyName, term, formData)
      {
        fixTimeRange.toFormData(formData, term, 'date+time');
      },
      'tag': function(propertyName, term, formData)
      {
        formData[propertyName] = term.args[1];
      }
    },

    serializeFormToQuery: function(selector)
    {
      var timeRange = fixTimeRange.fromView(this);
      var tag = this.$id('tag').val();

      selector.push({name: 'eq', args: ['tag', tag]});

      if (timeRange.from)
      {
        selector.push({name: 'ge', args: ['time', timeRange.from]});
      }

      if (timeRange.to)
      {
        selector.push({name: 'lt', args: ['time', timeRange.to]});
      }
    },

    afterRender: function()
    {
      FilterView.prototype.afterRender.call(this);

      this.$id('tag').select2({
        width: '300px',
        data: this.serializeSelect2Tags()
      });
    },

    serializeSelect2Tags: function()
    {
      return controller
        .filter(function(tag) { return tag.get('archive') === 'avg'; })
        .map(idAndLabel);
    }

  });
});
