// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'app/i18n',
  'app/core/View',
  'app/screens/util/svg'
], function(
  _,
  t,
  View,
  svg
) {
  'use strict';

  /**
   * @constructor
   * @extends {View}
   */
  function Rect()
  {
    View.apply(this, arguments);

    this.listenTo(this.model.component, 'resize', this.onResize);
    this.listenTo(this.model.component, 'move', this.onMove);
  }

  inherits(Rect, View, {

    model: {
      /** @type {EditorViewport} */
      viewport: null,
      /** @type {Screen} */
      screen: null,
      /** @type {ScreenComponent} */
      component: null
    },

    el: function()
    {
      return svg.createElement('g', {
        class: 'screenComponent'
      });
    }

  });

  Rect.defaults = function()
  {
    return {
      name: t('screens', 'rect:name'),
      width: 100,
      height: 50,
      background: {
        color: '#FFFFFF',
        images: []
      },
      border: {
        color: '#000000',
        width: 1,
        style: 'solid'
      }
    };
  };

  Rect.prototype.afterRender = function()
  {
    var component = this.model.component;

    this.el.id = this.model.screen.getComponentElementId(component.id);
    this.el.setAttribute('data-component-id', component.id);
    this.el.appendChild(svg.createElement('rect'));
    this.resize();
    this.applyStyles();
  };

  /**
   * @private
   */
  Rect.prototype.applyStyles = function()
  {
    this.applyBackgroundStyles();
    this.applyBorderStyles();
  };

  Rect.prototype.applyBackgroundStyles = function()
  {
    var style = this.el.firstElementChild.style;
    var background = this.model.component.get('background');

    style.fill = background && background.color ? background.color : 'none';
  };

  Rect.prototype.applyBorderStyles = function()
  {
    var style = this.el.firstElementChild.style;
    var scale = this.model.viewport.scale;
    var border = this.model.component.get('border') || {};
    var borderWidth = (border.width || 1) * scale;

    if (border.color)
    {
      style.stroke = border.color;
    }

    switch (border.style)
    {
      case 'solid':
        break;

      case 'dashed':
        style.strokeDasharray = (borderWidth * 3) + ' ' + (borderWidth * 3);
        break;

      case 'dotted':
        style.strokeDasharray = borderWidth + ' ' + (borderWidth * 4);
        break;

      default:
        if (!_.isEmpty(border.style))
        {
          style.strokeDasharray = border.style;
        }
        break;
    }

    var subPixel = false;

    if (border.width)
    {
      var strokeWidth = Math.max(borderWidth, 1);

      style.strokeWidth = strokeWidth;

      subPixel = Math.floor(strokeWidth) % 2 === 1;
    }

    this.el.setAttribute('transform', subPixel ? 'translate(0.5, 0.5)' : '');
  };

  Rect.prototype.resize = function()
  {
    var scale = this.model.viewport.scale;
    var component = this.model.component;
    var rect = this.el.firstElementChild;
    var x = component.get('x') * scale;
    var y = component.get('y') * scale;
    var w = component.get('width') * scale;
    var h = component.get('height') * scale;

    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
  };

  Rect.prototype.scale = function()
  {
    this.resize();
    this.applyBorderStyles();
  };

  /**
   * @private
   */
  Rect.prototype.onResize = function()
  {
    this.resize();
  };

  /**
   * @private
   */
  Rect.prototype.onMove = function()
  {
    var scale = this.model.viewport.scale;
    var component = this.model.component;
    var x = component.get('x') * scale;
    var y = component.get('y') * scale;

    var rect = this.el.firstElementChild;

    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
  };

  return Rect;
});
