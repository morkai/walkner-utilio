// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

/**
 * @param {?number} number
 * @returns {?number}
 */
module.exports = function round(number)
{
  return number === null ? null : (Math.round(number * 10000) / 10000);
};
