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

  var INTERVALS = {
    minutely: 'minutes',
    hourly: 'hours',
    daily: 'days',
    monthly: 'months'
  };

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
          headerFormatter: function(ctx)
          {
            return time.format(typeof ctx === 'number' ? ctx : ctx.x, 'LL, HH:mm');
          }
        },
        legend: {
          enabled: false
        },
        plotOptions: {
          line: {
            marker: {
              enabled: false,
              states: {
                hover: {
                  enabled: true
                }
              }
            },
            states: {
              hover: {
                lineWidthPlus: 0
              }
            }
          },
          column: {
            borderWidth: 0,
            groupPadding: 0,
            pointPadding: series[0].data.length > 31 ? 0 : 0.1
          }
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
      var valueAxis = {
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
        return valueAxis;
      }

      valueAxis.labels.format += tag.get('scaleUnit') || '';

      var yAxis = [valueAxis];
      var deltas = this.model.get('deltas');

      if (deltas.length)
      {
        yAxis.push({
          title: false,
          decimals: 3,
          opposite: true
        });
      }

      return yAxis;
    },

    serializeSeries: function()
    {
      var tag = controller.get(this.model.get('tag'));
      var from = this.model.get('firstTime') || this.model.get('from');
      var interval = INTERVALS[this.model.get('interval')];
      var moment = time.getMoment(from);
      var values = this.model.get('values').map(function(v, i)
      {
        var x = moment.valueOf();

        moment.add(1, interval);

        return [x, v];
      });
      var series = [{
        type: 'line',
        name: tag ? tag.id : '?',
        data: values,
        zIndex: 2,
        color: '#E00',
        tooltipOptions: {
          valueDecimals: 2,
          valueSuffix: tag.get('scaleUnit') || ''
        }
      }];

      var deltas = this.model.get('deltas');

      if (deltas.length)
      {
        series.push({
          yAxis: 1,
          type: 'column',
          name: tag ? tag.id : '?',
          data: deltas.map(this.model.get('deltaField') === 'dMax'
            ? function(v, i) { return [values[i][0], v < 0 ? 0 : v]; }
            : function(v, i) { return [values[i][0], v]; }
          ),
          tooltip: {
            valueDecimals: 3
          }
        });
      }

      return series;
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
