// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  'app/data/controller',
  './StaticView',
  'ejs!app/screens/templates/static/b41'
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
  function B41View()
  {
    StaticView.apply(this, arguments);
  }

  inherits(B41View, StaticView, {

    template: template

  });

  /**
   * @private
   * @param {*} newValue
   * @param {string} tagName
   */
  B41View.prototype.updateState = function(newValue, tagName)
  {
    switch (tagName)
    {
      case 'em.x.sum':
        this.setTagValue(tagName, newValue);
        this.updateRecentTagValue(tagName, newValue);
        break;
    }
  };

  return B41View;
});
