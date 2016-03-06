// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'app/user',
  'app/i18n',
  'app/core/views/ListView',
  'app/core/views/ActionFormView',
  '../Alarm'
], function(
  _,
  user,
  t,
  ListView,
  ActionFormView,
  Alarm
) {
  'use strict';

  return ListView.extend({

    className: 'is-clickable is-colored',

    remoteTopics: {
      'alarms.**': function(message, topic)
      {
        if (topic === 'alarms.deleted')
        {
          this.onModelDeleted(message);
        }
        else
        {
          this.refreshCollection();
        }
      }
    },

    events: _.extend({
      'click .action-alarm-ack': function(e)
      {
        ActionFormView.showDialog({
          actionKey: 'ack',
          model: this.getModelFromEvent(e),
          formActionSeverity: 'success'
        });

        e.preventDefault();
      },
      'click .action-alarm-run': function(e)
      {
        ActionFormView.showDialog({
          actionKey: 'run',
          model: this.getModelFromEvent(e)
        });

        e.preventDefault();
      },
      'click .action-alarm-stop': function(e)
      {
        ActionFormView.showDialog({
          actionKey: 'stop',
          model: this.getModelFromEvent(e),
          formActionSeverity: 'warning'
        });

        e.preventDefault();
      },
      'click .action-delete': function(e)
      {
        ActionFormView.showDeleteDialog({
          model: this.getModelFromEvent(e)
        });

        e.preventDefault();
      }
    }, ListView.prototype.events),

    serializeColumns: function()
    {
      var columns = [{
        id: 'name',
        label: this.options.nameLabel || t('alarms', 'PROPERTY:name')
      }];

      if (this.options.hideStateColumn !== true)
      {
        columns.push({id: 'stateText', label: t('alarms', 'PROPERTY:state'), className: 'is-min'});
      }

      columns.push({
        id: 'lastStateChangeTimeText',
        label: this.options.lastStateChangeTimeLabel || t('alarms', 'PROPERTY:lastStateChangeTime'),
        className: 'is-min'
      });

      return columns;
    },

    serializeActions: function()
    {
      var showManageActions = this.options.hideManageActions !== true && user.isAllowedTo('ALARMS:MANAGE');
      var canAck = user.isAllowedTo('ALARMS:ACK');
      var collection = this.collection;
      var viewEditDelete = ListView.actions.viewEditDelete(collection);

      return function(row)
      {
        var model = collection.get(row._id);
        var actions = [];

        if (row.stopConditionMode === Alarm.StopConditionMode.MANUAL && canAck)
        {
          actions.push({
            id: 'alarm-ack',
            icon: 'thumbs-up',
            label: t('alarms', 'LIST:ACTION:ack'),
            href: model.genClientUrl('ack')
          });
        }

        if (showManageActions)
        {
          actions.push(
            {
              id: 'alarm-run',
              icon: 'play',
              label: t('alarms', 'LIST:ACTION:run'),
              href: model.genClientUrl('run')
            },
            {
              id: 'alarm-stop',
              icon: 'pause',
              label: t('alarms', 'LIST:ACTION:stop'),
              href: model.genClientUrl('stop')
            }
          );
        }

        actions.push(ListView.actions.viewDetails(model));

        if (showManageActions)
        {
          actions.push(
            ListView.actions.edit(model),
            ListView.actions.delete(model)
          );
        }

        return actions;
      };
    }

  });
});
