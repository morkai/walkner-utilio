// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/core/views/ListView'
], function(
  ListView
) {
  'use strict';

  return ListView.extend({

    className: 'is-clickable',

    localTopics: {
      'companies.synced': 'render'
    },

    columns: [
      {id: 'personnelId', className: 'is-min'},
      {id: 'login', className: 'is-min'},
      {id: 'lastName', className: 'is-min'},
      {id: 'firstName', className: 'is-min'},
      'email'
    ]

  });
});
