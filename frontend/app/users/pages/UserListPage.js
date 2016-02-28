// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/i18n',
  'app/core/pages/FilteredListPage',
  '../views/UserFilterView',
  '../views/UserListView'
], function(
  t,
  FilteredListPage,
  UserFilterView,
  UserListView
) {
  'use strict';

  return FilteredListPage.extend({

    FilterView: UserFilterView,
    ListView: UserListView,

    breadcrumbs: [
      t.bound('users', 'BREADCRUMBS:browse')
    ]

  });
});
