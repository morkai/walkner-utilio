// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/core/util/fixTimeRange',
  'app/core/views/FilterView',
  'app/analytics/templates/changesFilter'
], function(
  fixTimeRange,
  FilterView,
  template
) {
  'use strict';

  return FilterView.extend({

    template: template,

    defaultFormData: function()
    {
      return {
        from: '',
        to: ''
      };
    },

    termToForm: {
      't': function(propertyName, term, formData)
      {
        fixTimeRange.toFormData(formData, term, 'date+time');
      }
    },

    serializeFormToQuery: function(selector)
    {
      var timeRange = fixTimeRange.fromView(this);

      if (timeRange.from)
      {
        selector.push({name: 'ge', args: ['t', timeRange.from]});
      }

      if (timeRange.to)
      {
        selector.push({name: 'le', args: ['t', timeRange.to]});
      }
    }

  });
});
