// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  '../core/Collection',
  './TagValue'
], function(
  Collection,
  TagValue
) {
  'use strict';

  return Collection.extend({

    model: TagValue,

    rqlQuery: 'limit(20)',

    initialize: function(models, options)
    {
      Collection.prototype.initialize.apply(this, arguments);

      this.tag = options.tag;
    },

    url: function()
    {
      return '/tags/' + this.tag + '/changes';
    },

    genClientUrl: function()
    {
      return '#analytics/changes/' + this.tag;
    }

  });
});
