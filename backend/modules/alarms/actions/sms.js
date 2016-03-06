// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

const helpers = require('./helpers');

exports.execute = function(app, alarmsModule, runningAlarm, action)
{
  const smsSender = app[alarmsModule.config.smsSenderId];

  if (!smsSender)
  {
    return alarmsModule.warn('Cannot send SMS: sms module not available!');
  }

  helpers.findUsers(app, alarmsModule, runningAlarm, action, function(err, users)
  {
    if (runningAlarm.isStopped())
    {
      return;
    }

    const alarmName = runningAlarm.model.name;

    if (err)
    {
      return alarmsModule.error(`Failed to retrieve users for sms action of alarm [${alarmName}]: ${err.message}`);
    }

    const currentDate = new Date();
    const currentTimeValue = currentDate.getHours() * 1000 + currentDate.getMinutes();
    const recipients = users
      .filter(user => helpers.filterSmsRecipient(currentTimeValue, user))
      .map(user => user.mobile);

    if (recipients.length === 0)
    {
      return alarmsModule.warn(`Not sending any SMS: no recipients for action [${action.no}] of alarm: ${alarmName}`);
    }

    smsSender.send(recipients, action.parameters.text, function(err)
    {
      if (err)
      {
        alarmsModule.error(`Failed to send SMS as part of alarm [${alarmName}]: ${err.message}`);

        app.broker.publish('alarms.actions.smsFailed', {
          model: runningAlarm.toJSON(),
          action: {
            no: action.no,
            type: action.type
          },
          error: err.toJSON(),
          recipients: recipients
        });
      }
      else
      {
        alarmsModule.debug(`Sent SMS as part of alarm [${alarmName}] to: ${recipients.join('; ')}`);

        app.broker.publish('alarms.actions.smsSent', {
          model: runningAlarm.toJSON(),
          action: {
            no: action.no,
            type: action.type
          },
          recipients: recipients
        });
      }
    });
  });
};
