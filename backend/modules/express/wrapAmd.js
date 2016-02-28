// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

var _ = require('lodash');

module.exports = wrapAmd;

/**
 * @param {string} js
 * @param {Object<string, string>} [modules]
 * @returns {string}
 */
function wrapAmd(js, modules)
{
  var moduleArgs;
  var modulePaths;

  if (_.isObject(modules))
  {
    moduleArgs = _.keys(modules).join(', ');
    modulePaths = JSON.stringify(_.values(modules));
  }
  else
  {
    moduleArgs = '';
    modulePaths = '[]';
  }

  var wrappedJs = [
    'define(' + modulePaths + ', function(' + moduleArgs + ') {',
    js,
    '});'
  ];

  return wrappedJs.join('\n');
}
