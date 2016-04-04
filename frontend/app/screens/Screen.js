// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'app/core/Model',
  'app/screens/ScreenComponentCollection'
], function(
  _,
  Model,
  ScreenComponentCollection
) {
  'use strict';

  /**
   * @private
   * @param {string} cssLength
   * @param {number} zoomFactor
   * @returns {string}
   */
  function scaleCssLength(cssLength, zoomFactor)
  {
    return cssLength.replace(/([0-9]+)([a-z]+)/ig, function(match, value, unit) { return value * zoomFactor + unit; });
  }

  /**
   * @constructor
   * @extends {Model}
   */
  function Screen()
  {
    Model.apply(this, arguments);

    Object.defineProperty(this, 'components', {
      configurable: true,
      get: function()
      {
        var components = new ScreenComponentCollection(this.attributes.components, {
          paginate: false
        });

        delete this.components;

        /**
         * @memberOf Screen#
         * @type {ScreenComponentCollection}
         */
        this.components = components;

        return components;
      }
    });
  }

  inherits(Screen, Model, {
    urlRoot: '/screens',
    clientUrlRoot: '#screens',
    topicPrefix: 'screens',
    privilegePrefix: 'SCREENS',
    nlsDomain: 'screens',
    labelAttribute: 'name',
    defaults: function()
    {
      return {
        _id: null,
        name: '',
        slug: '',
        parent: null,
        background: null,
        width: 800,
        height: 600,
        components: null
      };
    }
  });

  Screen.prototype.getComponentElementId = function(componentId)
  {
    return '-' + this.id + '-' + componentId;
  };

  /**
   * @param {number} scale
   * @returns {string}
   */
  Screen.prototype.getBackground = function(scale)
  {
    var doScale = scale !== 1;
    var backgrounds = [];

    _.forEach(this.get('backgroundImages'), function(backgroundImage)
    {
      backgrounds.push(
        backgroundImage.image
        + ' ' + (doScale ? scaleCssLength(backgroundImage.position, scale) : backgroundImage.position)
        + '/' + (doScale ? scaleCssLength(backgroundImage.size, scale) : backgroundImage.size)
        + ' ' + backgroundImage.repeat
        + ' ' + backgroundImage.attachment
      );
    });

    backgrounds.push(this.get('backgroundColor'));

    return backgrounds.join(', ');
  };

  return Screen;
});
