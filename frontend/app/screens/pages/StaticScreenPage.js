// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/core/View',
  'app/data/controller'
], function(
  View,
  controller
) {
  'use strict';

  return View.extend({

    layoutName: 'page',

    load: function(when)
    {
      return when(controller.load());
    }

  });
});
