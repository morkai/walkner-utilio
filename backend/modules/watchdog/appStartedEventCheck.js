// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

var format = require('util').format;
var _ = require('lodash');

module.exports = function setUpAppStartedEventCheck(app, watchdogModule)
{
  var mailSender = app[watchdogModule.config.mailSenderId];
  var Event = app[watchdogModule.config.mongooseId].model('Event');

  var lastAppStartedCheckAt = -1;
  var consecutiveChecks = 0;

  app.broker.subscribe('app.started', checkAppStartedEvents).setLimit(1);

  function checkAppStartedEvents()
  {
    var now = Date.now();

    if (lastAppStartedCheckAt === -1)
    {
      lastAppStartedCheckAt = now;
    }

    Event.find({type: 'app.started', time: {$gte: lastAppStartedCheckAt}}).lean().exec(function(err, events)
    {
      if (err)
      {
        watchdogModule.error("Failed to find app.started events: %s", err.message);

        return setTimeout(checkAppStartedEvents, 60 * 1000);
      }

      lastAppStartedCheckAt = now;

      if (!events.length)
      {
        consecutiveChecks = 0;

        return setTimeout(checkAppStartedEvents, 60 * 1000);
      }

      notifyAppStartedEvent(events);

      ++consecutiveChecks;

      setTimeout(checkAppStartedEvents, consecutiveChecks * 15 * 60 * 1000);
    });
  }

  function notifyAppStartedEvent(events)
  {
    var to = _.uniq([].concat(
      watchdogModule.config.recipients,
      watchdogModule.config.appStartedRecipients
    ));

    if (to.length === 0 && _.isEmpty(watchdogModule.config.appStartedCallRecipient))
    {
      return watchdogModule.warn("[app.started] Nobody to notify :(");
    }

    var restarts = {};

    _.forEach(events, function(event)
    {
      var appId = event.data.id;

      if (!restarts[appId])
      {
        restarts[appId] = {
          count: 0,
          time: event.time
        };
      }

      ++restarts[appId].count;
    });

    var subject = format(
      "[%s:%s:appStarted] %s", app.options.id, watchdogModule.name, Object.keys(restarts).join(', ')
    );
    var text = [
      "Detected server restarts:"
    ];

    _.forEach(restarts, function(appRestart, appId)
    {
      text.push(format(
        "  - %dx %s @ %s",
        appRestart.count,
        appId,
        app.formatDateTime(appRestart.time)
      ));
    });

    text.push(
      "",
      "This message was generated automatically.",
      "Sincerely, WMES Bot"
    );

    text = text.join('\r\n');

    if (to.length)
    {
      mailSender.send(to, subject, text, function(err)
      {
        if (err)
        {
          watchdogModule.error("[app.started] Failed to notify [%s]: %s", to, err.message);
        }
        else
        {
          watchdogModule.debug("[app.started] Notified: %s", to);
        }
      });
    }

    var twilio = app[watchdogModule.config.twilioId];

    if (twilio && watchdogModule.config.appStartedCallRecipient)
    {
      var sayOptions = {
        to: watchdogModule.config.appStartedCallRecipient,
        message: text,
        voice: 'alice',
        language: 'en-US'
      };

      twilio.say(sayOptions, function(err)
      {
        if (err)
        {
          watchdogModule.error("[app.started] Failed to notify [%s]: %s", sayOptions.to, err.message);
        }
        else
        {
          watchdogModule.debug("[app.started] Notified: %s", sayOptions.to);
        }
      });
    }
  }
};
