// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-hydro project <http://lukasz.walukiewicz.eu/p/walkner-hydro>

define([
  'app/i18n',
  'app/time',
  'app/core/views/ListView'
], function(
  t,
  time,
  ListView
) {
  'use strict';

  return ListView.extend({

    serializeColumns: function()
    {
      var columns = [{
        id: 't',
        label: t('analytics', 'PROPERTY:time'),
        className: 'is-min'
      }];

      if (this.isAverage())
      {
        columns.push(
          {id: 'v', label: t('analytics', 'PROPERTY:value:avg'), className: 'is-min'},
          {id: 'n', label: t('analytics', 'PROPERTY:value:min'), className: 'is-min'},
          {id: 'x', label: t('analytics', 'PROPERTY:value:max')}
        );
      }
      else
      {
        columns.push({id: 'v', label: t('analytics', 'PROPERTY:value')});
      }

      return columns;
    },

    serializeActions: function()
    {
      return null;
    },

    serializeRow: function(model)
    {
      var row = model.toJSON();

      row.t = time.format(row.t, 'YYYY-MM-DD, HH:mm:ss');

      switch (typeof row.v)
      {
        case 'number':
          row.v = (Math.round(row.v * 100) / 100).toLocaleString();

          if (row.n)
          {
            row.n = (Math.round(row.n * 100) / 100).toLocaleString();
          }

          if (row.x)
          {
            row.x = (Math.round(row.x * 100) / 100).toLocaleString();
          }
          break;

        case 'boolean':
          row.v = row.v ? 'TRUE' : 'FALSE';
          break;
      }

      return row;
    },

    isAverage: function()
    {
      return this.collection.length > 0 && !isNaN(this.collection.first().get('x'));
    }

  });
});
