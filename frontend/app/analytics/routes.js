// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-hydro project <http://lukasz.walukiewicz.eu/p/walkner-hydro>

define([
  '../router',
  '../user',
  '../viewport',
  '../data/controller',
  '../tags/TagValueCollection',
  './pages/ChartsPage',
  './pages/ChangesPage',
  './pages/TagChangesPage',
  'i18n!app/nls/analytics',
  'i18n!app/nls/tags'
], function(
  router,
  user,
  viewport,
  controller,
  TagValueCollection,
  ChartsPage,
  ChangesPage,
  TagChangesPage
) {
  'use strict';

  var canView = user.auth('ANALYTICS:VIEW');

  router.map('/analytics/charts', canView, function(req)
  {
    viewport.showPage(new ChartsPage({rqlQuery: req.rql}));
  });

  router.map('/analytics/changes', canView, function()
  {
    viewport.showPage(new ChangesPage({
      collection: controller
    }));
  });

  router.map('/analytics/changes/:tag', canView, function showTagChanges(req)
  {
    viewport.showPage(new TagChangesPage({
      collection: new TagValueCollection(null, {
        tag: req.params.tag,
        rqlQuery: req.rql
      })
    }));
  });
});
