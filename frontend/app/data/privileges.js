// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([

], function(

) {
  'use strict';

  var STORAGE_KEY = 'PRIVILEGES';
  var privileges = window[STORAGE_KEY] || [];

  delete window[STORAGE_KEY];

  return privileges;
});
