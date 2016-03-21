// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  '../core/Model',
  './ComponentCollection'
], function(
  Model,
  ComponentCollection
) {
  'use strict';

  return Model.extend({

    urlRoot: '/screens',

    clientUrlRoot: '#screens',

    topicPrefix: 'screens',

    privilegePrefix: 'SCREENS',

    nlsDomain: 'screens',

    labelAttribute: 'name',

    defaults: function()
    {
      return {
        _id: null,
        name: '',
        slug: '',
        parent: null,
        background: null,
        width: 800,
        height: 600,
        components: null
      };
    },

    initialize: function()
    {
      var screen = this;

      Object.defineProperty(this, 'components', {
        configurable: true,
        get: function()
        {
          var components = new ComponentCollection(screen.attributes.components, {
            paginate: false
          });

          delete this.components;
          this.components = components;

          return components;
        }
      });
    }

  });
});
