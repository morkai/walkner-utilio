// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  'app/core/View',
  'ejs!app/screens/templates/editor/toolbar'
], function(
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
  function ToolbarView()
  {
    View.apply(this, arguments);

    this.listenTo(this.model, 'zoomed', this.onViewportZoomed);
    this.listenTo(this.model, 'gridToggled', this.onGridToggled);
    this.listenTo(this.model.selection, 'add remove reset', this.onSelectionChange);
  }

  inherits(ToolbarView, View, {

    /**
     * @type {EditorViewport}
     */
    model: null,

    template: template,

    bindThis: [],

    events: {
      'click [data-action]': 'onActionClick'
    }

  });

  ToolbarView.prototype.destroy = function()
  {

  };

  ToolbarView.prototype.afterRender = function()
  {
    this.onGridToggled();
    this.onSelectionChange();
  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ToolbarView.prototype.onActionClick = function(e)
  {
    e.preventDefault();
    e.currentTarget.blur();

    var action = e.currentTarget.dataset.action;

    switch (action)
    {
      case 'zoom':
        this.trigger('action:zoom', e.currentTarget.dataset.scale / 100);
        break;

      default:
        this.trigger('action:' + action);
        break;
    }
  };

  /**
   * @private
   */
  ToolbarView.prototype.onViewportZoomed = function()
  {
    this.$id('scale').text(Math.round(this.model.scale * 100) + '%');
  };

  /**
   * @private
   */
  ToolbarView.prototype.onGridToggled = function()
  {
    var view = this;

    view.timers.setTimeout = setTimeout(function()
    {
      view.$id('toggleGrid').toggleClass('active', view.model.grid.enabled);
    }, 1);
  };

  /**
   * @private
   */
  ToolbarView.prototype.onSelectionChange = function()
  {
    var noSelection = this.model.selection.isEmpty();

    this.$('[data-selection]').each(function()
    {
      this.disabled = noSelection;
    });
  };

  return ToolbarView;
});
