// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  '../core/Model'
], function(
  Model
) {
  'use strict';

  return Model.extend({

    urlRoot: '/tags',

    clientUrlRoot: '#tags',

    topicPrefix: 'tags',

    privilegePrefix: 'TAGS',

    nlsDomain: 'users',

    idAttribute: 'name',

    labelAttribute: 'description'

  });
});
