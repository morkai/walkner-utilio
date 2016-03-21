// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  'app/i18n',
  'app/viewport',
  'app/core/View',
  '../views/editor/ViewportView',
  'app/screens/templates/editor/page'
], function(
  _,
  $,
  t,
  viewport,
  View,
  ViewportView,
  editorPageTemplate
) {
  'use strict';

  return View.extend({

    template: editorPageTemplate,

    layoutName: 'page',

    breadcrumbs: [
      {
        href: '#screens',
        label: t.bound('screens', 'BREADCRUMBS:browse')
      },
      {
        href: '#screens/test',
        label: 'Testowy ekran'
      },
      t.bound('screens', 'BREADCRUMBS:editForm')
    ],

    events: {

    },

    initialize: function()
    {
      this.defineModels();
      this.defineViews();
      this.defineBindings();

      this.setView('#' + this.idPrefix + '-viewport', this.viewportView);
    },

    destroy: function()
    {
      $('.ft').css('display', '');
      $(document.body).css('overflow', '');
      $(window).off('.' + this.idPrefix);
    },

    defineModels: function()
    {

    },

    defineViews: function()
    {
      this.viewportView = new ViewportView({
        model: this.model
      });
    },

    defineBindings: function()
    {

    },

    load: function(when)
    {
      return when(

      );
    },

    afterRender: function()
    {
console.log('screenEditorPage#afterRender');

      $('.ft').css('display', 'none');
      $(document.body).css('overflow', 'hidden');

      var page = this;

      requestAnimationFrame(function()
      {
        page.viewportView.setGrid(15, 15);
        page.viewportView.scrollIntoView();
      });
    }

  });
});
