// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/core/views/FilterView',
  'app/alarms/templates/filter'
], function(
  FilterView,
  template
) {
  'use strict';

  return FilterView.extend({

    template: template,

    defaultFormData: {
      name: '',
      state: ''
    },

    termToForm: {
      'name': function(propertyName, term, formData)
      {
        if (term.name === 'regex')
        {
          formData[propertyName] = term.args[1].replace(/\\(.)/g, '$1');
        }
      },
      'state': function(propertyName, term, formData)
      {
        formData[propertyName] = +term.args[1];
      }
    },

    serializeFormToQuery: function(selector)
    {
      var state = parseInt(this.$id('state').val(), 10);

      if (!isNaN(state))
      {
        selector.push({name: 'eq', args: ['state', state]});
      }

      this.serializeRegexTerm(selector, 'name', null, null, true);
    }

  });
});
