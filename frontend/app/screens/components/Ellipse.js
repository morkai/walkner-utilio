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
  function Ellipse()
  {
    View.apply(this, arguments);

    this.listenTo(this.model.component, 'resize', this.onResize);
    this.listenTo(this.model.component, 'move', this.onMove);
  }

  inherits(Ellipse, View, {

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

  Ellipse.defaults = function()
  {
    return {
      name: t('screens', 'ellipse:name'),
      width: 50,
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

  Ellipse.prototype.afterRender = function()
  {
    var component = this.model.component;

    this.el.id = this.model.screen.getComponentElementId(component.id);
    this.el.setAttribute('data-component-id', component.id);
    this.el.appendChild(svg.createElement('ellipse'));
    this.resize();
    this.applyStyles();
  };

  /**
   * @private
   */
  Ellipse.prototype.applyStyles = function()
  {
    this.applyBackgroundStyles();
    this.applyBorderStyles();
  };

  Ellipse.prototype.applyBackgroundStyles = function()
  {
    var style = this.el.firstElementChild.style;
    var background = this.model.component.get('background');

    style.fill = background && background.color ? background.color : 'none';
  };

  Ellipse.prototype.applyBorderStyles = function()
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

  Ellipse.prototype.resize = function()
  {
    var scale = this.model.viewport.scale;
    var component = this.model.component;
    var ellipse = this.el.firstElementChild;
    var width = component.get('width') / 2;
    var height = component.get('height') / 2;
    var x = (component.get('x') + width) * scale;
    var y = (component.get('y') + height) * scale;
    var w = width * scale;
    var h = height * scale;

    ellipse.setAttribute('cx', x);
    ellipse.setAttribute('cy', y);
    ellipse.setAttribute('rx', w);
    ellipse.setAttribute('ry', h);
  };

  Ellipse.prototype.scale = function()
  {
    this.resize();
    this.applyBorderStyles();
  };

  /**
   * @private
   */
  Ellipse.prototype.onResize = function()
  {
    this.resize();
  };

  /**
   * @private
   */
  Ellipse.prototype.onMove = function()
  {
    var scale = this.model.viewport.scale;
    var component = this.model.component;
    var x = (component.get('x') + component.get('width') / 2) * scale;
    var y = (component.get('y') + component.get('height') / 2) * scale;

    var ellipse = this.el.firstElementChild;

    ellipse.setAttribute('cx', x);
    ellipse.setAttribute('cy', y);
  };

  return Ellipse;
});
