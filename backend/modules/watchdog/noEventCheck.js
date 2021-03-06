// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

var format = require('util').format;
var _ = require('lodash');
var later = require('later');
var moment = require('moment');

module.exports = function setUpNoEventCheck(app, watchdogModule)
{
  var mailSender = app[watchdogModule.config.mailSenderId];
  var Event = app[watchdogModule.config.mongooseId].model('Event');

  _.forEach(watchdogModule.config.events, function(event)
  {
    _.defaults(event, {
      checkDelay: 30,
      checkWindow: Math.round((event.checkDelay || 30) * 1.5)
    });

    watchdogModule.debug(
      "[noEvent] [%s] Setting up... next occurrence at %s!",
      event.id,
      app.formatDateTime(later.schedule(event.schedule).next(1))
    );

    later.setInterval(scheduleEventCheck.bind(null, event), event.schedule);
  });

  function scheduleEventCheck(event)
  {
    watchdogModule.debug("[noEvent] [%s] Scheduling next check to be in %d minutes...", event.id, event.checkDelay);

    setTimeout(checkEvent, event.checkDelay * 60 * 1000, event);
  }

  function checkEvent(event)
  {
    watchdogModule.debug("[noEvent] [%s] Checking...", event.id);

    var conditions = _.assign({type: event.type}, event.conditions);

    Event.find(conditions, {time: 1}).sort({time: -1}).limit(1).exec(function(err, docs)
    {
      if (err)
      {
        return watchdogModule.error("[noEvent] [%s] Failed to find events: %s", event.id, err.message);
      }

      var lastOccurrenceAt = docs.length ? docs[0].time : 0;
      var requiredOccurrenceAt = moment().subtract(event.checkWindow, 'minutes').valueOf();

      if (lastOccurrenceAt >= requiredOccurrenceAt)
      {
        return watchdogModule.info("[noEvent] [%s] Event occurred! We're fine, everything is fine :)", event.id);
      }

      watchdogModule.warn("[noEvent] [%s] Event not occurred :( Notifying concerned parties!", event.id);

      notifyNoEvent(event, lastOccurrenceAt);
    });
  }

  function notifyNoEvent(event, lastOccurrenceAt)
  {
    var to = _.uniq([].concat(
      event.recipients || [],
      watchdogModule.config.recipients,
      watchdogModule.config.noEventRecipients
    ));

    if (to.length === 0)
    {
      return watchdogModule.warn("[noEvent] [%s] Nobody to notify :(", event.id);
    }

    var subject = format("[%s:%s:noEvent] %s", app.options.id, watchdogModule.name, event.id);
    var text = [
      format(
        "Expected an event of type '%s' in the last %d minutes, but no event occurred :(",
        event.type,
        event.checkWindow
      ),
      format("The last occurrence was at %s.", app.formatDateTime(lastOccurrenceAt)),
      "",
      "This message was generated automatically.",
      "Sincerely, WMES Bot"
    ];

    mailSender.send(to, subject, text.join('\r\n'), function(err)
    {
      if (err)
      {
        watchdogModule.error("[noEvent] [%s] Failed to notify [%s]: %s", event.id, to, err.message);
      }
      else
      {
        watchdogModule.debug("[noEvent] [%s] Notified: %s", event.id, to);
      }
    });
  }
};
