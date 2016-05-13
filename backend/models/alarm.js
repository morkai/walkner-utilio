// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const _ = require('lodash');

module.exports = function setupAlarmModel(app, mongoose)
{
  /**
   * @enum {number}
   */
  const AlarmState = {
    STOPPED: 0,
    RUNNING: 1,
    ACTIVE: 2
  };

  /**
   * @enum {string}
   */
  const AlarmStopConditionMode = {
    MANUAL: 'manual',
    NEGATED: 'negated',
    SPECIFIED: 'specified'
  };

  /**
   * @enum {string}
   */
  const AlarmSeverity = {
    DEBUG: 'debug',
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  };

  const actionSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['sms', 'email', 'call', 'severity'],
      required: true
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed
    },
    delay: {
      type: Number,
      min: 0,
      max: 3600 * 24,
      default: 0
    },
    severity: {
      type: String,
      enum: _.values(AlarmSeverity),
      default: AlarmSeverity.WARNING
    }
  }, {
    _id: false
  });

  const alarmSchema = new mongoose.Schema({
    name: {
      type: String,
      trim: true,
      required: true
    },
    state: {
      type: Number,
      min: 0,
      max: 2,
      default: AlarmState.STOPPED
    },
    lastStateChangeTime: {
      type: Number,
      min: 0,
      default: 0
    },
    startCondition: {
      type: String
    },
    startConditionTags: [String],
    startFunction: {
      type: String,
      default: ''
    },
    startActions: [actionSchema],
    stopConditionMode: {
      type: String,
      enum: _.values(AlarmStopConditionMode)
    },
    stopCondition: {
      type: String
    },
    stopConditionTags: [String],
    stopFunction: {
      type: String,
      default: ''
    },
    stopActions: [actionSchema]
  }, {
    toJSON: {
      virtuals: true,
      transform: function(alarm, ret)
      {
        delete ret.startFunction;
        delete ret.stopFunction;

        return ret;
      }
    }
  }, {
    id: false
  });

  alarmSchema.index({state: -1});

  alarmSchema.path('startActions').validate(
    function(actions)
    {
      return Array.isArray(actions) && actions.length > 0;
    },
    'INVALID_ACTIONS'
  );

  alarmSchema.pre('save', function(next)
  {
    if (this.isDirectModified('state'))
    {
      this.lastStateChangeTime = Date.now();
    }

    next();
  });

  alarmSchema.statics.State = AlarmState;

  alarmSchema.statics.StopConditionMode = AlarmStopConditionMode;

  /**
   * @param {Object<string, *>} leanAlarm
   * @param {Object<string, boolean>} fields
   * @returns {Object}
   */
  alarmSchema.statics.customizeLeanObject = function(leanAlarm, fields)
  {
    const allFields = _.isEmpty(fields);

    if (allFields || fields.actionIndex || fields.severity)
    {
      const actionIndex = getCurrentActionIndex(leanAlarm);

      if (allFields || fields.actionIndex)
      {
        leanAlarm.actionIndex = actionIndex;
      }

      if (allFields || fields.severity)
      {
        leanAlarm.severity = getCurrentSeverity(leanAlarm, actionIndex);
      }
    }

    return leanAlarm;
  };

  alarmSchema.virtual('actionIndex').get(function()
  {
    return getCurrentActionIndex(this);
  });

  alarmSchema.virtual('severity').get(function()
  {
    return getCurrentSeverity(this, getCurrentActionIndex(this));
  });

  /**
   * @param {number} startConditionMetAt
   * @returns {number}
   */
  alarmSchema.methods.getCurrentStartActionIndex = function(startConditionMetAt)
  {
    const startActions = this.startActions;
    const timeDiff = Date.now() - startConditionMetAt;
    let currentActionIndex = -1;
    let timeSum = 0;

    for (let i = 0; i < startActions.length; ++i)
    {
      timeSum += startActions[i].delay * 1000;

      if (timeDiff < timeSum)
      {
        break;
      }

      currentActionIndex = i;
    }

    return currentActionIndex;
  };

  /**
   * @param {number} actionIndex
   * @param {number} startConditionMetAt
   * @returns {number}
   */
  alarmSchema.methods.getStartActionExecutionTime = function(actionIndex, startConditionMetAt)
  {
    if (actionIndex < 0 || actionIndex >= this.startActions.length)
    {
      return -1;
    }

    let executionTime = startConditionMetAt;

    for (let i = 0; i <= actionIndex; ++i)
    {
      executionTime += this.startActions[i].delay * 1000;
    }

    return executionTime;
  };

  /**
   * @returns {boolean}
   */
  alarmSchema.methods.isStopped = function()
  {
    return this.state === AlarmState.STOPPED;
  };

  /**
   * @returns {boolean}
   */
  alarmSchema.methods.isRunning = function()
  {
    return this.state === AlarmState.RUNNING;
  };

  /**
   * @returns {boolean}
   */
  alarmSchema.methods.isActive = function()
  {
    return this.state === AlarmState.ACTIVE;
  };

  /**
   * @returns {boolean}
   */
  alarmSchema.methods.isManualStop = function()
  {
    return this.stopConditionMode === AlarmStopConditionMode.MANUAL;
  };

  /**
   * @returns {boolean}
   */
  alarmSchema.methods.isNegatedStop = function()
  {
    return this.stopConditionMode === AlarmStopConditionMode.NEGATED;
  };

  /**
   * @returns {boolean}
   */
  alarmSchema.methods.isSpecifiedStop = function()
  {
    return this.stopConditionMode === AlarmStopConditionMode.SPECIFIED;
  };

  mongoose.model('Alarm', alarmSchema);

  /**
   * @private
   * @param {Object} alarm
   * @returns {number}
   */
  function getCurrentActionIndex(alarm)
  {
    if (alarm.state !== AlarmState.ACTIVE || typeof alarm.lastStateChangeTime !== 'number')
    {
      return -1;
    }

    var startActions = alarm.startActions;

    if (!Array.isArray(startActions) || startActions.length === 0)
    {
      return -1;
    }

    const timeDiff = Date.now() - alarm.lastStateChangeTime;
    let timeSum = 0;

    for (let i = 0; i < startActions.length; ++i)
    {
      timeSum += startActions[i].delay * 1000;

      if (timeDiff < timeSum)
      {
        return i;
      }
    }

    return startActions.length - 1;
  }

  /**
   * @private
   * @param {Object} alarm
   * @param {number} actionIndex
   * @returns {?string}
   */
  function getCurrentSeverity(alarm, actionIndex)
  {
    return actionIndex === -1
      ? (alarm.state === AlarmState.ACTIVE ? 'debug' : null)
      : alarm.startActions[actionIndex].severity;
  }
};
