// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'app/i18n',
  'app/core/View',
  'app/core/util/onModelDeleted',
  '../Alarm',
  'app/alarms/templates/details',
  'app/alarms/templates/messageActionDetails',
  'app/alarms/templates/severityActionDetails'
], function(
  _,
  t,
  View,
  onModelDeleted,
  Alarm,
  detailsTemplate,
  messageActionDetailsTemplate,
  severityActionDetailsTemplate
) {
  'use strict';

  return View.extend({

    template: detailsTemplate,

    remoteTopics: {
      'alarms.run': function(message)
      {
        this.updateAlarmModel(message.model, {
          state: Alarm.State.RUNNING,
          severity: null,
          actionIndex: -1
        });
      },
      'alarms.stopped': function(message)
      {
        this.updateAlarmModel(message.model, {
          state: Alarm.State.STOPPED,
          severity: null,
          actionIndex: -1
        });
      },
      'alarms.acked': function(message)
      {
        this.updateAlarmModel(message.model, {
          state: Alarm.State.RUNNING,
          severity: null,
          actionIndex: -1
        });
      },
      'alarms.activated': function(message)
      {
        this.updateAlarmModel(message.model, {state: Alarm.State.ACTIVE});
      },
      'alarms.deactivated': function(message)
      {
        this.updateAlarmModel(message.model, {
          state: Alarm.State.RUNNING,
          severity: null,
          actionIndex: -1
        });
      },
      'alarms.actionExecuted': function(message)
      {
        this.updateAlarmModel(message.model, {
          severity: message.action.severity,
          actionIndex: message.action.no - 1
        });
      },
      'alarms.edited': function(message)
      {
        this.updateAlarmModel(message.model, message.model);
      },
      'alarms.deleted': function(message)
      {
        onModelDeleted(this.broker, this.model.alarm, message);
      }
    },

    initialize: function()
    {
      this.listenTo(this.model.alarm, 'change', _.after(1, this.render.bind(this)));
    },

    serialize: function()
    {
      var alarm = this.model.alarm.serialize();

      return {
        idPrefix: this.idPrefix,
        alarm: alarm,
        startActions: this.serializeActions(alarm.startActions)
      };
    },

    serializeActions: function(actions)
    {
      return actions.map(function(action)
      {
        switch (action.type)
        {
          case 'sms':
          case 'email':
            if (_.isArray(action.parameters.users))
            {
              action.parameters.users = action.parameters.users
                .map(function(user) { return '<a href="#users/' + user.id + '">' + user.label + '</a>'; })
                .join(', ');
            }

            action.render = messageActionDetailsTemplate.bind(null, action);

            return action;

          default:
            action.render = severityActionDetailsTemplate.bind(null, action);

            return action;
        }
      })
      .filter(function(action) { return !!action; });
    },

    afterRender: function()
    {
      if (this.model.alarm.get('actionIndex') !== -1)
      {
        this.$('.alarms-details-action')
          .eq(this.model.alarm.get('actionIndex'))
          .addClass('active');
      }
    },

    updateAlarmModel: function(alarm, data)
    {
      if (alarm._id === this.model.alarm.id)
      {
        this.model.alarm.set(data);
      }
    }

  });
});
