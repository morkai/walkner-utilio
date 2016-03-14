// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-hydro project <http://lukasz.walukiewicz.eu/p/walkner-hydro>

define([
  'app/viewport',
  'app/i18n',
  'app/data/controller',
  'app/core/pages/FilteredListPage',
  '../views/TagChangesFilterView',
  '../views/TagChangesListView'
], function(
  viewport,
  t,
  controller,
  FilteredListPage,
  TagChangesFilterView,
  TagChangesListView
) {
  'use strict';

  return FilteredListPage.extend({

    FilterView: TagChangesFilterView,
    ListView: TagChangesListView,

    breadcrumbs: function()
    {
      var tag = controller.get(this.collection.tag);

      return [
        t.bound('analytics', 'BREADCRUMBS:base'),
        {
          label: t.bound('analytics', 'BREADCRUMBS:changes'),
          href: '#analytics/changes'
        },
        tag ? tag.getLabel() : this.collection.tag
      ];
    },

    actions: [],

    load: function(when)
    {
      return when(this.collection.fetch({reset: true}), controller.load());
    }

  });
});
