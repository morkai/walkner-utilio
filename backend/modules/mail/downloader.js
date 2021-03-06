// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

exports.DEFAULT_CONFIG = {
  savePath: '/var/tmp',
  matcher: email => /* eslint no-unused-vars:0 */ true,
  timestamp: false
};

exports.start = function startMailDownloaderModule(app, module)
{
  app.broker.subscribe('mail.received', function downloadMail(mail)
  {
    if (typeof module.config.matcher === 'function' && !module.config.matcher(mail))
    {
      return;
    }

    if (!Array.isArray(mail.attachments) || mail.attachments.length === 0)
    {
      return module.debug("Ignoring an e-mail without any attachments: subject=%s", mail.subject);
    }

    var timestamp = Math.round(Date.now() / 1000);

    if (mail.headers.date)
    {
      var time = new Date(mail.headers.date).getTime();

      if (!isNaN(time))
      {
        timestamp = Math.round(time / 1000);
      }
    }

    module.debug("Saving %d attachment(s) from e-mail: %s", mail.attachments.length, mail.subject);

    _.forEach(mail.attachments, function(attachment)
    {
      var savePath = createSavePath(timestamp, attachment.fileName);

      fs.writeFile(savePath, attachment.content, function(err)
      {
        if (err)
        {
          module.error("Failed to save the '%s' attachment: %s", attachment.fileName, err.message);
        }
        else
        {
          module.debug("Saved attachment: %s", attachment.fileName);
        }
      });
    });
  });

  function createSavePath(timestamp, fileName)
  {
    if (module.config.timestamp)
    {
      fileName = timestamp + '@' + fileName;
    }

    return path.resolve(module.config.savePath, fileName);
  }
};
