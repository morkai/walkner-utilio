// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/core/views/FilterView',
  'app/users/templates/filter'
], function(
  FilterView,
  filterTemplate
) {
  'use strict';

  return FilterView.extend({

    template: filterTemplate,

    defaultFormData: {
      personnelId: '',
      login: '',
      lastName: ''
    },

    termToForm: {
      'personnelId': function(propertyName, term, formData)
      {
        if (term.name === 'regex')
        {
          formData[propertyName] = term.args[1].replace('^', '');
        }
      },
      'login': 'personnelId',
      'lastName': 'personnelId'
    },

    serializeFormToQuery: function(selector)
    {
      var personnelId = parseInt(this.$id('personnelId').val().trim(), 10);
      var login = this.$id('login').val().trim();
      var lastName = this.$id('lastName').val().trim();

      if (!isNaN(personnelId))
      {
        selector.push({name: 'regex', args: ['personnelId', '^' + personnelId, 'i']});
      }

      if (login.length)
      {
        selector.push({name: 'regex', args: ['login', '^' + login, 'i']});
      }

      if (lastName.length)
      {
        selector.push({name: 'regex', args: ['lastName', '^' + lastName, 'i']});
      }
    }

  });
});
