// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  'app/data/controller',
  './StaticView',
  'ejs!app/screens/templates/static/b6'
], function(
  _,
  $,
  controller,
  StaticView,
  template
) {
  'use strict';

  /**
   * @constructor
   * @extends {StaticView}
   */
  function B6View()
  {
    StaticView.apply(this, arguments);
  }

  inherits(B6View, StaticView, {

    template: template

  });
  /**
   * @private
   * @param {*} newValue
   * @param {string} tagName
   */
  B6View.prototype.updateState = function(newValue, tagName)
  {
    switch (tagName)
    {
      case 'em.5.sum':
      case 'em.6.sum':
        this.setTagValue(tagName, newValue);
        this.updateRecentTagValue(tagName, newValue);
        break;
    }
  };

  return B6View;
});
