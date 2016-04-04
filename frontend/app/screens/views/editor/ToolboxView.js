// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'require',
  'underscore',
  'jquery',
  'app/core/View',
  'ejs!app/screens/templates/editor/toolbox'
], function(
  require,
  _,
  $,
  View,
  template
) {
  'use strict';

  /**
   * @constructor
   * @extends {View}
   */
  function ToolboxView()
  {
    View.apply(this, arguments);
  }

  inherits(ToolboxView, View, {

    /**
     * @type {EditorViewport}
     */
    model: null,

    template: template,

    bindThis: [],

    events: {
      'mousedown .screenEditor-toolbox-component': 'onComponentMouseDown'
    }

  });

  ToolboxView.prototype.destroy = function()
  {

  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ToolboxView.prototype.onComponentMouseDown = function(e)
  {
    this.model.dropping.type = e.currentTarget.dataset.type;
    this.model.dropping.startOnMove = {
      pageX: e.pageX,
      pageY: e.pageY
    };
  };

  return ToolboxView;
});
