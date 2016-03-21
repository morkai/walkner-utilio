// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'app/core/View',
  'app/screens/templates/editor/viewport',
  'app/screens/templates/editor/gridL',
  'app/screens/templates/editor/gridS'
], function(
  _,
  View,
  template,
  gridLTemplate,
  gridSTemplate
) {
  'use strict';

  function createSvgElement(name, attributes)
  {
    var svgElement = document.createElementNS('http://www.w3.org/2000/svg', name);

    _.forEach(attributes, function(v, k)
    {
      svgElement.setAttribute(k, v);
    });

    return svgElement;
  }

  function clearSvgElement(svgElement)
  {
    while (svgElement.lastElementChild)
    {
      svgElement.removeChild(svgElement.lastElementChild);
    }
  }

  return View.extend({

    template: template,

    events: {
      'mousedown': function(e)
      {
        if (e.button === 2)
        {
          this.startPanning(e);

          return false;
        }
      },
      'mouseup': function(e)
      {
        if (this.panning.enabled && e.button === 2)
        {
          this.stopPanning(e);

          return false;
        }

        if (this.dragging.enabled && e.button === 0)
        {
          this.stopDragging(e);

          return false;
        }

        if (this.resizing.enabled && e.button === 0)
        {
          this.stopResizing(e);

          return false;
        }

        this.model.selection.reset();
      },
      'mousemove': function(e)
      {
        if (this.panning.enabled)
        {
          this.handlePanning(e);

          return false;
        }

        if (this.dragging.enabled)
        {
          this.handleDragging(e);

          return false;
        }

        if (this.resizing.enabled)
        {
          this.handleResizing(e);

          return false;
        }
      },
      'mousedown .screen-component': function(e)
      {
        if (e.button === 0)
        {
          this.select(e.currentTarget.getAttribute('data-id'), e.ctrlKey);

          if (!e.ctrlKey)
          {
            this.startDragging(e);
          }

          return false;
        }
      },
      'mouseup .screen-component': function(e)
      {
        if (this.panning.enabled || this.resizing.enabled || this.dragging.enabled)
        {
          return;
        }

        if (e.button === 0)
        {
          return false;
        }
      },
      'contextmenu': function()
      {
        return false;
      },
      'mousedown .screenEditor-resizeHandle': function(e)
      {
        if (e.button === 0)
        {
          this.startResizing(e);

          return false;
        }
      }
    },

    initialize: function()
    {
      this.panning = {
        enabled: false,
        x: 0,
        y: 0
      };
      this.dragging = {
        enabled: false,
        x: 0,
        y: 0
      };
      this.resizing = {
        enabled: false,
        direction: null,
        x: 0,
        y: 0,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        component: null,
        handleEl: null
      };

      this.listenTo(this.model.selection, 'reset', this.onSelectionReset);
      this.listenTo(this.model.selection, 'add', this.onSelectionAdd);
      this.listenTo(this.model.selection, 'remove', this.onSelectionRemove);

      this.listenTo(this.model.screen.components, 'resize', function(component)
      {
        var x = component.get('x');
        var y = component.get('y');
        var w = component.get('width');
        var h = component.get('height');

        if (this.resizing.enabled)
        {
          this.updateResizeHandlePosition(
            this.resizing.handleEl,
            this.getResizeHandlePosition(this.resizing.direction, x, y, w, h)
          );
        }

        var componentEl = this.els.components.querySelector('.screen-component[data-id="' + component.id + '"]');
        var rect = componentEl.firstElementChild;

        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', w);
        rect.setAttribute('height', h);
      });
      this.listenTo(this.model.screen.components, 'move', function(component)
      {
        var x = component.get('x');
        var y = component.get('y');
        var componentEl = this.els.components.querySelector('.screen-component[data-id="' + component.id + '"]');
        var rect = componentEl.firstElementChild;

        rect.setAttribute('x', x);
        rect.setAttribute('y', y);

        this.updateComponentSelection(component);
      });
    },

    destroy: function()
    {
      this.els = null;
    },

    serialize: function()
    {
      var screen = this.model.screen;
      var canvasWidth = screen.get('width');
      var canvasHeight = screen.get('height');

      return {
        idPrefix: this.idPrefix,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        innerWidth: canvasWidth + 2,
        innerHeight: canvasHeight + 2,
        outerWidth: canvasWidth + 2002,
        outerHeight: canvasHeight + 1002
      };
    },

    afterRender: function()
    {
console.log('viewport#afterRender');

      this.els = {
        outer: this.el,
        $outer: this.$el,
        inner: this.$id('inner')[0],
        $inner: this.$id('inner'),
        canvas: this.$id('canvas')[0],
        $canvas: this.$id('canvas'),
        components: this.$id('components')[0],
        $components: this.$id('components'),
        selection: this.$id('selection')[0],
        $selection: this.$id('selection')
      };
    },

    startPanning: function(e)
    {
      this.panning.enabled = true;
      this.panning.x = e.screenX;
      this.panning.y = e.screenY;

      this.$el.addClass('is-panning');
    },

    stopPanning: function()
    {
      this.panning.enabled = false;

      this.$el.removeClass('is-panning');
    },

    handlePanning: function(e)
    {
      var panning = this.panning;
      var x = e.screenX;
      var y = e.screenY;

      if (x === panning.x && y === panning.y)
      {
        return;
      }

      var deltaX = -(x - panning.x);
      var deltaY = -(y - panning.y);

      this.el.parentNode.scrollLeft += deltaX;
      this.el.parentNode.scrollTop += deltaY;

      panning.x = x;
      panning.y = y;
    },

    startDragging: function(e)
    {
      this.dragging.enabled = true;
      this.dragging.x = e.screenX;
      this.dragging.y = e.screenY;

      this.$el.addClass('is-dragging');
    },

    stopDragging: function()
    {
      this.dragging.enabled = false;

      this.$el.removeClass('is-dragging');
    },

    handleDragging: function(e)
    {
      var dragging = this.dragging;
      var x = e.screenX;
      var y = e.screenY;

      if (x === dragging.x && y === dragging.y)
      {
        return;
      }

      var deltaX = x - dragging.x;
      var deltaY = y - dragging.y;

      this.model.selection.forEach(function(component)
      {
        component.move(component.get('x') + deltaX, component.get('y') + deltaY);
      });

      dragging.x = x;
      dragging.y = y;
    },

    scrollTo: function(x, y)
    {
      if (y == null)
      {
        y = x;
      }

      this.el.parentNode.scrollLeft = x;
      this.el.parentNode.scrollTop = y;
    },

    scrollIntoView: function()
    {
      var viewportSize = this.el.parentNode.getClientRects()[0];
      var canvasSize = this.els.inner.getClientRects()[0];
      var x = this.els.inner.offsetLeft;
      var y = this.els.inner.offsetTop;

      if (viewportSize.width > canvasSize.width)
      {
        x -= Math.round((viewportSize.width - canvasSize.width) / 2);
      }
      else
      {
        x -= 40;
      }

      if (viewportSize.height > canvasSize.height)
      {
        y -= Math.round((viewportSize.height - canvasSize.height) / 2);
      }
      else
      {
        y -= 40;
      }

      this.scrollTo(x, y);
    },

    select: function(componentId, multiple)
    {
      var component = this.model.screen.components.get(componentId);

      if (!component)
      {
        return;
      }

      var selection = this.model.selection;

      if (selection.get(component.id))
      {
        if (multiple)
        {
          selection.remove(component);

          return;
        }

        selection.remove(selection.filter(function(c) { return c.id !== componentId; }));

        return;
      }

      if (selection.length && !multiple)
      {
        selection.reset();
      }

      selection.add(component);
    },

    onSelectionReset: function(selection, options)
    {
      if (options.previousModels.length)
      {
        clearSvgElement(this.els.selection);
      }
    },

    onSelectionAdd: function(component)
    {
      this.updateComponentSelection(component);
    },

    updateComponentSelection: function(component)
    {
      var selectionEl = this.els.selection;
      var existingEls = selectionEl.querySelectorAll('[data-component-id="' + component.id + '"]');
      var update = existingEls.length > 0;
      var x = component.get('x');
      var y = component.get('y');
      var w = component.get('width');
      var h = component.get('height');
      var resizeHandles = [
        this.getResizeHandlePosition('n', x, y, w, h),
        this.getResizeHandlePosition('nw', x, y, w, h),
        this.getResizeHandlePosition('ne', x, y, w, h),
        this.getResizeHandlePosition('w', x, y, w, h),
        this.getResizeHandlePosition('e', x, y, w, h),
        this.getResizeHandlePosition('s', x, y, w, h),
        this.getResizeHandlePosition('sw', x, y, w, h),
        this.getResizeHandlePosition('se', x, y, w, h)
      ];

      if (update)
      {
        var outlineEl = existingEls[0];

        outlineEl.setAttribute('x', x);
        outlineEl.setAttribute('y', y);
        outlineEl.setAttribute('width', w);
        outlineEl.setAttribute('height', h);
      }
      else
      {
        selectionEl.appendChild(createSvgElement('rect', {
          x: x,
          y: y,
          width: w,
          height: h,
          class: 'screenEditor-selection-outline',
          'data-component-id': component.id
        }));
      }

      for (var handleI = 0; handleI < resizeHandles.length; ++handleI)
      {
        var resizeHandle = resizeHandles[handleI];

        if (update)
        {
          this.updateResizeHandlePosition(existingEls[handleI + 1], resizeHandle);

          continue;
        }

        var g = createSvgElement('g', {
          class: 'screenEditor-resizeHandle screenEditor-resizeHandle-' + resizeHandle.direction,
          'data-component-id': component.id,
          'data-direction': resizeHandle.direction
        });
        var circle1 = createSvgElement('circle', {
          r: '6',
          cx: resizeHandle.x,
          cy: resizeHandle.y,
          fill: '#00A8FF'
        });
        var circle2 = createSvgElement('circle', {
          r: '5',
          cx: resizeHandle.x,
          cy: resizeHandle.y,
          fill: '#fff'
        });
        var circle3 = createSvgElement('circle', {
          r: '3',
          cx: resizeHandle.x,
          cy: resizeHandle.y,
          fill: '#00A8FF'
        });

        g.appendChild(circle1);
        g.appendChild(circle2);
        g.appendChild(circle3);

        selectionEl.appendChild(g);
      }
    },

    updateResizeHandlePosition: function(handleEl, position)
    {
      for (var circleI = 0; circleI < 3; ++circleI)
      {
        var circleEl = handleEl.children[circleI];

        circleEl.setAttribute('cx', position.x);
        circleEl.setAttribute('cy', position.y);
      }
    },

    getResizeHandlePosition: function(direction, x, y, w, h)
    {
      var position = {
        direction: direction,
        x: x,
        y: y
      };

      switch (direction)
      {
        case 'n':
          position.x += w / 2;
          break;

        case 'ne':
          position.x += w;
          break;

        case 'e':
          position.x += w;
          position.y += h / 2;
          break;

        case 'se':
          position.x += w;
          position.y += h;
          break;

        case 's':
          position.x += w / 2;
          position.y += h;
          break;

        case 'sw':
          position.y += h;
          break;

        case 'w':
          position.y += h / 2;
          break;
      }

      return position;
    },

    onSelectionRemove: function(component)
    {
      this.els.$selection.find('[data-component-id="' + component.id + '"]').remove();
    },

    startResizing: function(e)
    {
      var resizing = this.resizing;
      var resizeHandleEl = e.currentTarget;
      var component = this.model.screen.components.get(resizeHandleEl.getAttribute('data-component-id'));

      resizing.enabled = true;
      resizing.x = e.screenX;
      resizing.y = e.screenY;
      resizing.top = component.get('y');
      resizing.bottom = resizing.top + component.get('height');
      resizing.left = component.get('x');
      resizing.right = resizing.left + component.get('width');
      resizing.component = component;
      resizing.handleEl = resizeHandleEl;
      resizing.direction = resizeHandleEl.getAttribute('data-direction');

      resizeHandleEl.classList.add('is-active');

      this.$el.addClass('is-resizing');
    },

    stopResizing: function()
    {
      var resizing = this.resizing;

      resizing.handleEl.classList.remove('is-active');

      this.onSelectionAdd(resizing.component);

      resizing.enabled = false;
      resizing.component = null;
      resizing.handleEl = null;

      this.$el.removeClass('is-resizing');
    },

    handleResizing: function(e)
    {
      var resizing = this.resizing;
      var x = e.screenX;
      var y = e.screenY;

      if (x === resizing.x && y === resizing.y)
      {
        return;
      }

      var deltaX = x - resizing.x;
      var deltaY = y - resizing.y;
      var resizeX = deltaX;
      var resizeY = deltaY;

      switch (resizing.direction)
      {
        case 'nw':
          resizing.top += deltaY;
          resizing.left += deltaX;
          break;

        case 'n':
          resizing.top += deltaY;
          resizeX = 0;
          break;

        case 'ne':
          resizing.top += deltaY;
          resizing.right += deltaX;
          break;

        case 'e':
          resizing.right += deltaX;
          resizeY = 0;
          break;

        case 'se':
          resizing.bottom += deltaY;
          resizing.right += deltaX;
          break;

        case 's':
          resizing.bottom += deltaY;
          resizeX = 0;
          break;

        case 'sw':
          resizing.bottom += deltaY;
          resizing.left += deltaX;
          break;

        case 'w':
          resizing.left += deltaX;
          resizeY = 0;
          break;
      }

      if (resizeX !== 0 || resizeY !== 0)
      {
        for (var i = 0; i < 3; ++i)
        {
          var circleEl = resizing.handleEl.children[i];

          circleEl.setAttribute('cx', circleEl.cx.baseVal.value + resizeX);
          circleEl.setAttribute('cy', circleEl.cy.baseVal.value + resizeY);
        }

        var dir1 = resizing.direction.charAt(0);
        var dir2 = resizing.direction.charAt(1);
        var swap;

        if (resizing.top > resizing.bottom)
        {
          swap = resizing.top;

          resizing.top = resizing.bottom;
          resizing.bottom = swap;

          resizing.direction = (dir1 === 'n' ? 's' : 'n') + dir2;
        }

        if (resizing.left > resizing.right)
        {
          if (dir2 === '')
          {
            resizing.direction = dir1 === 'e' ? 'w' : 'e';
          }
          else
          {
            resizing.direction = dir1 + (dir2 === 'e' ? 'w' : 'e');
          }

          swap = resizing.left;

          resizing.left = resizing.right;
          resizing.right = swap;
        }

        var width = resizing.right - resizing.left;
        var height = resizing.bottom - resizing.top;

        resizing.component.resize(resizing.left, resizing.top, width, height);
      }

      resizing.x = x;
      resizing.y = y;
    },

    setGrid: function(width, height, color)
    {
      width = width || 20;
      height = height || 20;
      color = color || '#999';

      var template = false && (width > 25 || height > 25) ? gridLTemplate : gridSTemplate;
      var svg = template({
        width: width,
        height: height,
        color: color
      });

      this.els.inner.style.backgroundImage
        = 'url(data:image/svg+xml;base64,' + btoa(svg) + '), url(/assets/factory-layout.jpg)';
    }

  });
});
