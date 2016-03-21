// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  '../core/Model'
], function(
  Model
) {
  'use strict';

  return Model.extend({

    defaults: function()
    {
      return {
        _id: null,
        type: null,
        name: null,
        parent: null,
        width: 100,
        height: 100,
        x: 0,
        y: 0
      };
    },

    initialize: function()
    {

    },

    setSize: function(width, height)
    {
      this.set({
        width: width,
        height: height
      });
    },

    resize: function(x, y, width, height)
    {
      this.set({
        x: x,
        y: y,
        width: width,
        height: height
      });
      this.trigger('resize', this);
    },

    move: function(x, y)
    {
      this.set({
        x: x,
        y: y
      });
      this.trigger('move', this);
    }

  });
});
