// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'jquery',
  'app/viewport',
  'app/i18n',
  'app/core/util/pageActions',
  'app/core/util/bindLoadingMessage',
  'app/core/pages/DetailsPage',
  'app/core/views/ActionFormView',
  'app/users/UserCollection',
  'app/events/EventCollection',
  'app/events/views/EventListView',
  '../Alarm',
  '../views/AlarmDetailsView',
  'app/alarms/templates/detailsPage',
  'i18n!app/nls/alarms',
  'i18n!app/nls/events'
], function(
  $,
  viewport,
  t,
  pageActions,
  bindLoadingMessage,
  DetailsPage,
  ActionFormView,
  UserCollection,
  EventCollection,
  EventListView,
  Alarm,
  AlarmDetailsView,
  template
) {
  'use strict';

  return DetailsPage.extend({

    template: template,

    actions: function()
    {
      var alarm = this.model;
      var actions = [];

      if (alarm.get('state') === Alarm.State.ACTIVE
        && alarm.get('stopConditionMode') === Alarm.StopConditionMode.MANUAL)
      {
        actions.push({
          label: t.bound('alarms', 'PAGE_ACTION:ack'),
          icon: 'thumbs-up',
          href: alarm.genClientUrl('ack'),
          privileges: 'ALARMS:ACK',
          callback: function(e)
          {
            if (e.which === 1)
            {
              ActionFormView.showDialog({
                actionKey: 'ack',
                model: alarm,
                formActionSeverity: 'success'
              });

              e.preventDefault();
            }
          }
        });
      }

      if (alarm.get('state') === Alarm.State.STOPPED)
      {
        actions.push({
          label: t.bound('alarms', 'PAGE_ACTION:run'),
          icon: 'play',
          href: alarm.genClientUrl('run'),
          privileges: 'ALARMS:MANAGE',
          callback: function(e)
          {
            if (e.which === 1)
            {
              ActionFormView.showDialog({
                actionKey: 'run',
                model: alarm
              });

              e.preventDefault();
            }
          }
        });
      }
      else
      {
        actions.push({
          label: t.bound('alarms', 'PAGE_ACTION:stop'),
          icon: 'pause',
          href: alarm.genClientUrl('stop'),
          privileges: 'ALARMS:MANAGE',
          callback: function(e)
          {
            if (e.which === 1)
            {
              ActionFormView.showDialog({
                actionKey: 'stop',
                model: alarm,
                formActionSeverity: 'warning'
              });

              e.preventDefault();
            }
          }
        });
      }

      return actions.concat(pageActions.edit(alarm), pageActions.delete(alarm));
    },

    initialize: function()
    {
      DetailsPage.prototype.initialize.apply(this, arguments);

      this.layout = null;

      this.defineBindings();

      this.setView('#' + this.idPrefix + '-details', this.detailsView);
      this.setView('#' + this.idPrefix + '-events', this.eventsView);
    },

    defineModels: function()
    {
      DetailsPage.prototype.defineModels.apply(this, arguments);

      var paginationUrlTemplate = this.model.genClientUrl() + '?eventsPage=${page}';

      this.events = bindLoadingMessage(new EventCollection(null, {
        rqlQuery: {
          selector: {
            name: 'and',
            args: [
              {name: 'regex', args: ['type', '^alarms\.']},
              {name: 'eq', args: ['data.model._id', this.model.id]}
            ]
          },
          sort: {
            time: -1
          },
          limit: 20,
          skip: ((this.options.eventsPage || 1) - 1) * 20
        }
      }), this);
      this.events.genPaginationUrlTemplate = function() { return paginationUrlTemplate; };
    },

    defineViews: function()
    {
      this.detailsView = new AlarmDetailsView({
        model: {
          alarm: this.model
        }
      });

      this.eventsView = new EventListView({
        collection: this.events
      });
    },

    setUpLayout: function(layout)
    {
      this.layout = layout;
    },

    defineBindings: function()
    {
      this.listenTo(this.model, 'change:state change:stopConditionMode', function()
      {
        if (this.layout)
        {
          this.layout.setActions(this.actions, this);
        }
      });
    },

    load: function(when)
    {
      return when(this.model.fetch(), this.events.fetch({reset: true}));
    }

  });
});
