// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-hydro project <http://lukasz.walukiewicz.eu/p/walkner-hydro>

define([
  'underscore',
  'h5.rql/index',
  'app/i18n',
  'app/time',
  'app/core/Model',
  'app/core/View',
  'app/core/util/bindLoadingMessage',
  'app/data/controller',
  '../views/ChartsFilterView',
  '../views/ChartsChartView',
  'app/analytics/templates/chartsPage'
], function(
  _,
  rql,
  t,
  time,
  Model,
  View,
  bindLoadingMessage,
  controller,
  ChartsFilterView,
  ChartsChartView,
  template
) {
  'use strict';

  return View.extend({

    template: template,

    layoutName: 'page',

    breadcrumbs: [
      t.bound('analytics', 'BREADCRUMBS:base'),
      t.bound('analytics', 'BREADCRUMBS:charts')
    ],

    initialize: function()
    {
      this.rqlQuery = rql.Query.fromObject(this.options.rqlQuery);
      this.model = _.extend(bindLoadingMessage(new Model(this.rqlToAttrs()), this), {
        url: function()
        {
          return '/tags/' + this.get('tag') + '/metric'
            + '?start=' + this.get('from')
            + '&stop=' + (this.get('to') || 0)
            + '&valueField=' + (this.get('valueField') || '')
            + '&deltaField=' + (this.get('deltaField') || '');
        }
      });

      this.filterView = new ChartsFilterView({
        model: {
          rqlQuery: this.rqlQuery
        }
      });
      this.chartView = new ChartsChartView({
        model: this.model
      });

      this.listenTo(this.filterView, 'filterChanged', this.onFilterChanged);

      this.setView('#' + this.idPrefix + '-filter', this.filterView);
      this.setView('#' + this.idPrefix + '-chart', this.chartView);
    },

    load: function(when)
    {
      return when(controller.load());
    },

    afterRender: function()
    {
      if (this.model.get('tag'))
      {
        this.model.fetch();
      }
    },

    rqlToAttrs: function()
    {
      var attrs = {
        values: [],
        deltas: [],
        to: null,
        valueField: 'avg',
        deltaField: ''
      };

      _.forEach(this.rqlQuery.selector.args, function(term)
      {
        if (term.name === 'eq' && term.args[0] === 'tag')
        {
          attrs.tag = term.args[1];
        }
        else if (term.name === 'ge' && term.args[0] === 'time')
        {
          attrs.from = term.args[1];
        }
        else if (term.name === 'lt' && term.args[0] === 'time')
        {
          attrs.to = term.args[1];
        }
      });

      if (!attrs.from || attrs.from < 0)
      {
        attrs.from = time.getMoment().subtract(24, 'hours').startOf('minute').valueOf();
        attrs.to = time.getMoment().startOf('minute').valueOf();
      }

      if (!attrs.to)
      {
        attrs.to = time.getMoment().startOf('minute').valueOf();
      }

      if (attrs.from > attrs.to)
      {
        var to = attrs.from;

        attrs.from = attrs.to;
        attrs.to = to;
      }

      if (/(sum|websockets)$/.test(attrs.tag))
      {
        attrs.valueField = 'max';
        attrs.deltaField = 'max';
      }
      else
      {
        attrs.deltaField = 'avg';
      }

      return attrs;
    },

    onFilterChanged: function(newRqlQuery)
    {
      this.rqlQuery = newRqlQuery;

      this.model.set(this.rqlToAttrs());
      this.model.fetch();

      this.broker.publish('router.navigate', {
        url: '/analytics/charts'
          + '?tag=' + this.model.get('tag')
          + '&time>=' + this.model.get('from')
          + '&time<' + this.model.get('to'),
        trigger: false,
        replace: true
      });
    }

  });
});
