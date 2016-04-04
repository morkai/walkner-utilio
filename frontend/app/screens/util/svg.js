// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore'
], function(
  _
) {
  'use strict';

  var svg = {
    createElement: function(name, attributes)
    {
      return svg.setAttributes(document.createElementNS('http://www.w3.org/2000/svg', name), attributes);
    },
    removeElement: function(el)
    {
      if (el && el.parentNode)
      {
        el.parentNode.removeChild(el);
      }
    },
    clearElement: function(el)
    {
      while (el.lastElementChild)
      {
        el.removeChild(el.lastElementChild);
      }
    },
    setAttributes: function(el, attributes)
    {
      _.forEach(attributes, function(v, k)
      {
        el.setAttribute(k, v);
      });

      return el;
    }
  };

  return svg;
});
