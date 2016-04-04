// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  'app/i18n',
  'app/viewport',
  'app/core/View',
  'app/screens/views/editor/ToolbarView',
  'app/screens/views/editor/ToolboxView',
  'app/screens/views/editor/ViewportView',
  'ejs!app/screens/templates/editor/page'
], function(
  _,
  $,
  t,
  viewport,
  View,
  ToolbarView,
  ToolboxView,
  ViewportView,
  pageTemplate
) {
  'use strict';

  /**
   * @constructor
   * @extends {View}
   */
  function ScreenEditorPage()
  {
    View.apply(this, arguments);

    this.defineModels();
    this.defineViews();
    this.defineBindings();

    this.insertView('#' + this.idPrefix + '-hd', this.toolbarView);
    this.insertView('#' + this.idPrefix + '-left', this.toolboxView);
    this.setView('#' + this.idPrefix + '-viewport', this.viewportView);
  }

  inherits(ScreenEditorPage, View, {

    template: pageTemplate,

    layoutName: 'page',

    breadcrumbs: function()
    {
      return [
        {
          href: '#screens',
          label: t.bound('screens', 'BREADCRUMBS:browse')
        },
        {
          href: this.model.screen.genClientUrl(),
          label: this.model.screen.getLabel()
        },
        t.bound('screens', 'BREADCRUMBS:editForm')
      ];
    },

    events: {

    }

  });

  ScreenEditorPage.prototype.destroy = function()
  {
    $('.ft').css('display', '');
    $(document.body).css('overflow', '');
    $(window).off('.' + this.idPrefix);
  };

  /**
   * @private
   */
  ScreenEditorPage.prototype.defineModels = function()
  {

  };

  /**
   * @private
   */
  ScreenEditorPage.prototype.defineViews = function()
  {
    this.toolbarView = new ToolbarView({
      model: this.model
    });
    this.toolboxView = new ToolboxView({
      model: this.model
    });
    this.viewportView = new ViewportView({
      model: this.model
    });
  };

  /**
   * @private
   */
  ScreenEditorPage.prototype.defineBindings = function()
  {
    $(window)
      .on('wheel.' + this.idPrefix, this.onWindowWheel.bind(this))
      .on('keydown.' + this.idPrefix, this.onWindowKeyDown.bind(this))
      .on('keyup.' + this.idPrefix, this.onWindowKeyUp.bind(this));

    this.defineToolbarBindings();
  };

  ScreenEditorPage.prototype.defineToolbarBindings = function()
  {
    var toolbarView = this.toolbarView;
    var viewportView = this.viewportView;
    var viewport = this.model;

    this.listenTo(toolbarView, 'action:toggleGrid', viewport.toggleGrid.bind(viewport));
    this.listenTo(toolbarView, 'action:zoom', viewport.zoomTo.bind(viewport));
    this.listenTo(toolbarView, 'action:zoomIn', viewport.zoomIn.bind(viewport));
    this.listenTo(toolbarView, 'action:zoomOut', viewport.zoomOut.bind(viewport));
    this.listenTo(toolbarView, 'action:deleteSelection', viewport.deleteSelection.bind(viewport));
    this.listenTo(toolbarView, 'action:sendSelectionToBack', viewportView.sendSelectionToBack.bind(viewportView));
    this.listenTo(toolbarView, 'action:sendSelectionBackward', viewportView.sendSelectionBackward.bind(viewportView));
    this.listenTo(toolbarView, 'action:bringSelectionForward', viewportView.bringSelectionForward.bind(viewportView));
    this.listenTo(toolbarView, 'action:bringSelectionToFront', viewportView.bringSelectionToFront.bind(viewportView));
  };

  ScreenEditorPage.prototype.load = function(when)
  {
    var componentTypes = {};
    var requireDeferred = $.Deferred(); // eslint-disable-line new-cap

    this.model.screen.components.forEach(function(component)
    {
      componentTypes[component.get('type')] = true;
    });

    require(Object.keys(componentTypes), function()
    {
      requireDeferred.resolve();
    });

    return when(requireDeferred.promise());
  };

  ScreenEditorPage.prototype.afterRender = function()
  {
    $('.ft').css('display', 'none');
    $(document.body).css('overflow', 'hidden');

    var page = this;

    requestAnimationFrame(function()
    {
      page.viewportView.scrollIntoView();
    });

console.clear();
  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ScreenEditorPage.prototype.onWindowWheel = function(e)
  {
    // Prevent page zooming by scrolling while holding Ctrl.
    if (e.ctrlKey)
    {
      e.preventDefault();
    }
  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ScreenEditorPage.prototype.onWindowKeyDown = function(e)
  {

  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ScreenEditorPage.prototype.onWindowKeyUp = function(e)
  {

  };

  return ScreenEditorPage;
});
