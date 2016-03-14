// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/i18n',
  'app/user',
  'app/core/View',
  'app/core/views/LogInFormView',
  'app/data/controller',
  '../views/DashboardView'
], function(
  t,
  user,
  View,
  LogInFormView,
  controller,
  DashboardView
) {
  'use strict';

  return View.extend({

    layoutName: 'page',

    pageId: 'dashboard',

    localTopics: {
      'user.reloaded': function()
      {
        this.view.remove();
        this.view = user.isLoggedIn() ? new DashboardView() : new LogInFormView();
        this.view.render();
      }
    },

    breadcrumbs: function()
    {
      return user.isLoggedIn() ? [] : [t.bound('dashboard', 'BREADCRUMBS:logIn')];
    },

    initialize: function()
    {
      this.view = user.isLoggedIn() ? new DashboardView() : new LogInFormView();
    },

    load: function(when)
    {
      return when(controller.load());
    },

    afterRender: function()
    {
      if (!user.isLoggedIn())
      {
        this.$('input[name="login"]').focus();
      }
    }

  });
});
