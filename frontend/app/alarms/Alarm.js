// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  '../i18n',
  '../time',
  '../core/Model'
], function(
  t,
  time,
  Model
) {
  'use strict';

  /**
   * @enum {number}
   */
  var AlarmState = {
    STOPPED: 0,
    RUNNING: 1,
    ACTIVE: 2
  };

  /**
   * @enum {string}
   */
  var AlarmStopConditionMode = {
    MANUAL: 'manual',
    NEGATED: 'negated',
    SPECIFIED: 'specified'
  };

  /**
   * @const
   */
  var SEVERITY_TO_CLASS_NAME = {
    debug: 'debug',
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'danger'
  };

  /**
   * @name Alarm
   * @constructor
   * @extends {Model}
   * @param {Object} [attributes]
   */
  var Alarm = Model.extend({

    urlRoot: '/alarms',

    clientUrlRoot: '#alarms',

    topicPrefix: 'alarms',

    privilegePrefix: 'ALARMS',

    nlsDomain: 'alarms',

    labelAttribute: 'name',

    defaults: function()
    {
      return {
        name: '',
        state: AlarmState.STOPPED,
        severity: null,
        actionIndex: -1,
        lastStateChangeTime: 0,
        startCondition: '',
        startActions: [],
        stopConditionMode: AlarmStopConditionMode.NEGATED,
        stopCondition: '',
        stopActions: []
      };
    },

    serialize: function()
    {
      var alarm = this.toJSON();

      alarm.data = {
        id: alarm._id,
        state: alarm.state
      };
      alarm.stateText = t('alarms', 'state:' + alarm.state);
      alarm.lastStateChangeTimeText = time.format(alarm.lastStateChangeTime, 'LL, HH:mm:ss');

      return alarm;
    },

    serializeRow: function()
    {
      var alarm = this.serialize();

      alarm.className = 'alarms-list-item ' + this.getSeverityClassName();
      alarm.dataAttrs = {
        state: alarm.state
      };

      return alarm;
    },

    getSeverityClassName: function()
    {
      return SEVERITY_TO_CLASS_NAME[this.get('severity')] || '';
    }

  });

  Alarm.State = AlarmState;
  Alarm.StopConditionMode = AlarmStopConditionMode;
  Alarm.SEVERITY_TO_CLASS_NAME = SEVERITY_TO_CLASS_NAME;

  return Alarm;
});
