// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/core/pages/FilteredListPage',
  '../views/AlarmFilterView',
  '../views/AlarmListView'
], function(
  FilteredListPage,
  AlarmFilterView,
  AlarmListView
) {
  'use strict';

  return FilteredListPage.extend({

    FilterView: AlarmFilterView,
    ListView: AlarmListView

  });
});
