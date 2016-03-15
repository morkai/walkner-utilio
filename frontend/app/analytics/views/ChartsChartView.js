// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-hydro project <http://lukasz.walukiewicz.eu/p/walkner-hydro>

define([
  'underscore',
  'jquery',
  'app/time',
  'app/highcharts',
  'app/core/View',
  'app/data/controller'
], function(
  _,
  $,
  time,
  Highcharts,
  View,
  controller
) {
  'use strict';

  return View.extend({

    className: 'analytics-charts-chart',

    initialize: function()
    {
      this.onWindowResize = _.debounce(this.resizeChart.bind(this), 30);
      this.chart = null;
      this.isLoading = false;

      this.listenTo(this.model, 'request', this.onModelLoading);
      this.listenTo(this.model, 'sync', this.onModelLoaded);
      this.listenTo(this.model, 'error', this.onModelError);
      this.listenTo(this.model, 'change:values', this.updateChart);

      $(window).on('resize.' + this.idPrefix, this.onWindowResize);
    },

    destroy: function()
    {
      $(window).off('.' + this.idPrefix);

      if (this.chart !== null)
      {
        this.chart.destroy();
        this.chart = null;
      }
    },

    afterRender: function()
    {
      this.resizeChart();

      if (this.timers.createOrUpdateChart)
      {
        clearTimeout(this.timers.createOrUpdateChart);
      }

      this.timers.createOrUpdateChart = setTimeout(this.createOrUpdateChart.bind(this), 1);
    },

    createOrUpdateChart: function()
    {
      this.timers.createOrUpdateChart = null;

      if (this.chart)
      {
        this.updateChart();
      }
      else
      {
        this.createChart();

        if (this.isLoading)
        {
          this.chart.showLoading();
        }
      }
    },

    createChart: function()
    {
      var series = this.serializeSeries();
      var yAxis = this.serializeYAxis();

      this.chart = new Highcharts.Chart({
        chart: {
          renderTo: this.el,
          plotBorderWidth: 1
        },
        exporting: {
          enabled: false
        },
        title: {
          text: ''
        },
        noData: {},
        xAxis: {
          type: 'datetime'
        },
        yAxis: yAxis,
        tooltip: {
          shared: true,
          valueSuffix: yAxis.suffix,
          valueDecimals: yAxis.decimals,
          headerFormatter: function(ctx)
          {
            return time.format(typeof ctx === 'number' ? ctx : ctx.x, 'LL, HH:mm');
          }
        },
        legend: {
          enabled: false
        },
        plotOptions: {

        },
        series: series
      });
    },

    updateChart: function()
    {
      if (this.chart)
      {
        this.chart.destroy();
        this.chart = null;
      }

      this.createChart();
    },

    serializeYAxis: function()
    {
      var tag = controller.get(this.model.get('tag'));
      var yAxis = {
        title: false,
        decimals: 0,
        opposite: false,
        suffix: '',
        labels: {
          format: '{value}'
        }
      };

      if (!tag)
      {
        return yAxis;
      }

      yAxis.decimals = 2;
      yAxis.suffix = tag.get('scaleUnit') || '';
      yAxis.labels.format += yAxis.suffix;

      return yAxis;
    },

    serializeSeries: function()
    {
      var tag = controller.get(this.model.get('tag'));
      var from = this.model.get('firstTime') || this.model.get('from');

      return [{
        type: 'line',
        name: tag ? tag.id : '?',
        data: this.model.get('values').map(function(v, i)
        {
          return [from + i * 60000, v];
        })
      }];
    },

    serializeChartData: function()
    {
      return {};
    },

    onModelLoading: function()
    {
      this.isLoading = true;

      if (this.chart)
      {
        this.chart.showLoading();
      }
    },

    onModelLoaded: function()
    {
      this.interval = null;
      this.isLoading = false;

      if (this.chart)
      {
        this.chart.hideLoading();
      }
    },

    onModelError: function()
    {
      this.isLoading = false;

      if (this.chart)
      {
        this.chart.hideLoading();
      }
    },

    resizeChart: function()
    {
      this.$el.height(this.calcChartHeight());

      if (this.chart)
      {
        this.chart.reflow();
      }
    },

    calcChartHeight: function()
    {
      return window.innerHeight - $('.hd').outerHeight() - $('.filter-container').outerHeight() - 30;
    }

  });
});
