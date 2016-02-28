// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

exports.dbName = 'walkner-utilio';

exports.backupPath = 'C:/backups/dump';

exports.mongodumpExe = 'C:/Program Files/MongoDB/bin/mongodump.exe';

exports.zipExe = 'C:/Program Files/7-Zip/7z.exe';

exports.excludeCollections = function(date) // eslint-disable-line no-unused-vars
{
  return [];
};
