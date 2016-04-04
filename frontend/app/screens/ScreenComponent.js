// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  '../core/Model'
], function(
  Model
) {
  'use strict';

  /**
   * @constructor
   * @extends {Model}
   */
  function ScreenComponent()
  {
    Model.apply(this, arguments);
  }

  inherits(ScreenComponent, Model);

  /**
   * @returns {Object}
   */
  ScreenComponent.prototype.defaults = function()
  {
    return {
      _id: null,
      cid: null,
      type: null,
      name: null,
      parent: null,
      width: null,
      height: null,
      x: 0,
      y: 0
    };
  };

  /**
   * @param {number} width
   * @param {number} height
   */
  ScreenComponent.prototype.setSize = function(width, height)
  {
    this.set({
      width: Math.round(width),
      height: Math.round(height)
    });
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} [width]
   * @param {number} [height]
   */
  ScreenComponent.prototype.resizeTo = function(x, y, width, height)
  {
    var attrs = this.attributes;

    attrs.width = Math.round(width);
    attrs.height = Math.round(height);

    if (arguments.length === 4)
    {
      attrs.x = Math.round(x);
      attrs.y = Math.round(y);
    }

    this.trigger('resize', this);
  };

  /**
   * @param {number} dWidth
   * @param {number} dHeight
   */
  ScreenComponent.prototype.resizeBy = function(dWidth, dHeight)
  {
    this.resizeTo(this.attributes.width + dWidth, this.attributes.height + dHeight);
  };

  /**
   * @param {number} x
   * @param {number} y
   */
  ScreenComponent.prototype.moveTo = function(x, y)
  {
    var attrs = this.attributes;
    var oldX = attrs.x;
    var oldY = attrs.y;

    attrs.x = Math.round(x);
    attrs.y = Math.round(y);

    if (attrs.x === oldX && attrs.y === oldY)
    {
      return;
    }

    this.trigger('move', this);
  };

  /**
   * @param {number} dX
   * @param {number} dY
   */
  ScreenComponent.prototype.moveBy = function(dX, dY)
  {
    this.moveTo(this.attributes.x + dX, this.attributes.y + dY);
  };

  return ScreenComponent;
});
