// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  '../core/Collection',
  './Alarm'
], function(
  Collection,
  Alarm
) {
  'use strict';

  return Collection.extend({

    model: Alarm,

    rqlQuery: 'select(name,state,lastStateChangeTime,severity,stopConditionMode)'
      + '&sort(-state,-lastStateChangeTime)'
      + '&limit(15)'

  });
});
