// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

module.exports = {
  uri: 'mongodb://127.0.0.1:27017/walkner-utilio',
  server: {
    poolSize: 15
  },
  db: {
    w: 1,
    wtimeout: 1000,
    nativeParser: true,
    forceServerObjectId: false
  }
};
