// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'require',
  'underscore',
  'jquery',
  'app/core/View',
  'app/core/util/uuid',
  'app/screens/ScreenComponent',
  'ejs!app/screens/templates/editor/viewport'
], function(
  require,
  _,
  $,
  View,
  uuid,
  ScreenComponent,
  template
) {
  'use strict';

  // TODO: Zooming during interactions

  var OUTER_PADDING_H = 1000;
  var OUTER_PADDING_V = 500;
  var INNER_BORDER_WIDTH = 1;
  var CONTAINER_BORDER_WIDTH = 1;
  var DRAGGING_START_THRESHOLD = 5;
  var DROPPING_START_THRESHOLD = 1;

  window.tlog = _.throttle(console.log.bind(console), 250);
  window.log = function() { console.log.apply(console, arguments); };

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

  /**
   * @constructor
   * @extends {View}
   */
  function ViewportView()
  {
    View.apply(this, arguments);

    window.vp = this;

    /**
     * @private
     * @type {function(this:ViewportView)}
     */
    this.handleScrolling = _.throttle(this.handleScrolling.bind(this), 1000 / 60);

    /**
     * @private
     * @type {function(this:ViewportView, MouseEvent)}
     */
    this.handleWindowMouseMove = _.throttle(this.handleWindowMouseMove.bind(this), 1000 / 60);

    /**
     * @private
     * @type {function(this:ViewportView)}
     */
    this.onWindowResize = _.debounce(this.onWindowResize.bind(this), 1000 / 30);

    /**
     * @private
     * @type {function(this:ViewportView)}
     */
    this.onContainerScroll = _.throttle(this.onContainerScroll.bind(this), 1000 / 60);

    this.els = {};
    this.down = {
      left: false,
      middle: false,
      right: false,
      ctrl: false,
      shift: false,
      alt: false
    };

    var viewport = this.model;

    this.listenTo(viewport, 'containerScrolled', this.onContainerScrolled);
    this.listenTo(viewport, 'panningForced', this.onPanningForced);
    this.listenTo(viewport, 'zoomed', this.onZoomed);
    this.listenTo(viewport, 'gridToggled', this.onGridToggled);

    this.listenTo(viewport.selection, 'reset', this.onSelectionReset);
    this.listenTo(viewport.selection, 'add', this.onSelectionAdd);
    this.listenTo(viewport.selection, 'remove', this.onSelectionRemove);

    this.listenTo(viewport.screen, 'change:backgroundColor change:backgroundImages', this.onScreenBackgroundChange);

    this.listenTo(viewport.screen.components, 'add', this.onComponentAdd);
    this.listenTo(viewport.screen.components, 'remove', this.onComponentRemove);
    this.listenTo(viewport.screen.components, 'resize', this.onComponentResize);
    this.listenTo(viewport.screen.components, 'move', this.onComponentMove);

    this.once('afterRender', function()
    {
      window.addEventListener('resize', this.onWindowResize, false);
      window.addEventListener('mousemove', this.onWindowMouseMove, false);
      window.addEventListener('mouseup', this.onWindowMouseUp, false);
      window.addEventListener('keydown', this.onWindowKeyDown, false);
      window.addEventListener('keyup', this.onWindowKeyUp, false);
    });
  }

  inherits(ViewportView, View, {

    /**
     * @type {EditorViewport}
     */
    model: null,

    template: template,

    bindThis: ['onWindowMouseUp', 'onWindowMouseMove', 'onWindowKeyDown', 'onWindowKeyUp'],

    events: {
      'mouseenter': 'onOuterMouseEnter',
      'mouseleave': 'onOuterMouseLeave',
      'mousedown': 'onOuterMouseDown',
      'contextmenu': 'onOuterContextMenu',
      'wheel': 'onOuterWheel',
      'mousedown .screenComponent': 'onComponentMouseDown',
      'mouseup .screenComponent': 'onComponentMouseUp',
      'keydown .screenComponent': 'onComponentKeyDown',
      'mousedown .screenEditor-resizeHandle': 'onResizeHandleMouseDown'
    }

  });

  ViewportView.prototype.destroy = function()
  {
    if (this.els.container)
    {
      this.els.container.removeEventListener('scroll', this.onContainerScroll, true);
    }

    window.removeEventListener('resize', this.onWindowResize, true);
    window.removeEventListener('mousemove', this.onWindowMouseMove, true);
    window.removeEventListener('mouseup', this.onWindowMouseUp, true);
    window.removeEventListener('keydown', this.onWindowKeyDown, true);
    window.removeEventListener('keyup', this.onWindowKeyUp, true);

    this.els = null;
  };

  ViewportView.prototype.serialize = function()
  {
    var screen = this.model.screen;
    var canvasWidth = screen.get('width');
    var canvasHeight = screen.get('height');

    return {
      idPrefix: this.idPrefix,
      background: this.getBackgroundStyle(),
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      innerWidth: canvasWidth + 2,
      innerHeight: canvasHeight + 2,
      outerWidth: canvasWidth + 2002,
      outerHeight: canvasHeight + 1002
    };
  };

  ViewportView.prototype.beforeRender = function()
  {
    if (this.els.container)
    {
      this.els.container.removeEventListener('scroll', this.onContainerScroll, true);
    }
  };

  ViewportView.prototype.afterRender = function()
  {
    this.els = {
      /** @type {HTMLElement} */
      container: this.el.parentElement,
      /** @type {jQuery} */
      $container: this.$el.parent(),
      /** @type {HTMLElement} */
      outer: this.el,
      /** @type {jQuery} */
      $outer: this.$el,
      /** @type {HTMLElement} */
      inner: this.$id('inner')[0],
      /** @type {jQuery} */
      $inner: this.$id('inner'),
      /** @type {SVGGraphicsElement} */
      canvas: this.$id('canvas')[0],
      /** @type {jQuery} */
      $canvas: this.$id('canvas'),
      /** @type {SVGGraphicsElement} */
      components: this.$id('components')[0],
      /** @type {jQuery} */
      $components: this.$id('components'),
      /** @type {SVGGraphicsElement} */
      selection: this.$id('selection')[0],
      /** @type {jQuery} */
      $selection: this.$id('selection'),
      /** @type {HTMLElement} */
      selectionBox: this.$id('selectionBox')[0],
      /** @type {jQuery} */
      $selectionBox: this.$id('selectionBox')
    };
    this.components = {};

    this.els.container.addEventListener('scroll', this.onContainerScroll, true);

    this.resizeContainer();
    this.resizeCanvas();
    this.renderComponents();
  };

  ViewportView.prototype.renderComponents = function()
  {
    this.removeView('.screenEditor-components');
    this.model.screen.components.forEach(this.renderComponent, this);
  };

  ViewportView.prototype.renderComponent = function(component)
  {
    var ComponentView = require(component.get('type'));
    var componentView = new ComponentView({
      model: {
        viewport: this.model,
        screen: this.model.screen,
        component: component
      }
    });

    this.components[component.id] = componentView;

    this.insertView('.screenEditor-components', componentView).render();
  };

  /**
   * @param {number} left
   * @param {number} top
   */
  ViewportView.prototype.scrollTo = function(left, top)
  {
    var containerEl = this.els.container;

    if (containerEl)
    {
      containerEl.scrollLeft = left;
      containerEl.scrollTop = top;
    }
  };

  /**
   * @param {number} deltaX
   * @param {number} [deltaY]
   */
  ViewportView.prototype.scrollBy = function(deltaX, deltaY)
  {
    var containerEl = this.els.container;

    if (containerEl)
    {
      this.scrollTo(
        containerEl.scrollLeft + deltaX,
        containerEl.scrollTop + (deltaY == null ? deltaX : deltaY)
      );
    }
  };

  /**
   * @param {boolean} [center=false]
   */
  ViewportView.prototype.scrollIntoView = function(center)
  {
    var containerRect = this.els.container.getBoundingClientRect();
    var canvasRect = this.els.canvas.getBoundingClientRect();
    var x = this.els.inner.offsetLeft;
    var y = this.els.inner.offsetTop;

    if (center || containerRect.width > canvasRect.width)
    {
      x -= Math.round((containerRect.width - canvasRect.width) / 2);
    }
    else
    {
      x -= 40;
    }

    if (center || containerRect.height > canvasRect.height)
    {
      y -= Math.round((containerRect.height - canvasRect.height) / 2);
    }
    else
    {
      y -= 40;
    }

    this.scrollTo(x, y);
  };

  /**
   * @param {number} width
   * @param {number} height
   * @param {string} [color]
   */
  ViewportView.prototype.setGrid = function(width, height, color)
  {
    if (!width || width < 5 || !height || height < 5)
    {
      return;
    }

    var grid = this.model.grid;

    grid.width = width;
    grid.height = height;
    grid.backgroundImage = null;

    if (color)
    {
      grid.color = color;
    }

    if (grid.enabled)
    {
      this.updateBackground();
    }
  };

  /**
   * @param {string} componentId
   * @param {boolean} multiple
   * @returns {?ScreenComponent}
   */
  ViewportView.prototype.select = function(componentId, multiple)
  {
    var component = this.model.screen.components.get(componentId);

    if (!component)
    {
      return null;
    }

    var selection = this.model.selection;

    if (selection.get(component.id))
    {
      return null;
    }

    if (selection.length && !multiple)
    {
      selection.reset();
    }

    selection.add(component);

    return component;
  };

  ViewportView.prototype.stopInteractions = function()
  {
    this.stopPanning();
    this.stopSelecting();
    this.stopResizing();
    this.stopDragging();
    this.stopDropping();
  };

  ViewportView.prototype.bringSelectionForward = function()
  {
    var componentsList = this.model.screen.components.models;
    var componentsEl = this.els.components;
    var orderedSelection = this.getOrderedSelection();

    for (var i = orderedSelection.length - 1; i >= 0; --i)
    {
      var selection = orderedSelection[i];

      var componentEl = selection.view.el;
      var nextSibling = componentEl.nextElementSibling;

      if (!nextSibling)
      {
        continue;
      }

      var prevComponent = orderedSelection[i + 1];

      if (prevComponent && nextSibling === prevComponent.view.el)
      {
        continue;
      }

      var nextNextSibling = nextSibling.nextElementSibling;

      if (nextNextSibling)
      {
        componentsEl.insertBefore(componentEl, nextNextSibling);
      }
      else
      {
        componentsEl.appendChild(componentEl);
      }

      componentsList.splice(selection.index, 1);
      componentsList.splice(selection.index + 1, 0, selection.model);
    }
  };

  ViewportView.prototype.sendSelectionBackward = function()
  {
    var componentsList = this.model.screen.components.models;
    var componentsEl = this.els.components;
    var orderedSelection = this.getOrderedSelection();

    for (var i = 0; i < orderedSelection.length; ++i)
    {
      var selection = orderedSelection[i];
      var componentEl = selection.view.el;
      var prevSibling = componentEl.previousElementSibling;

      if (!prevSibling)
      {
        continue;
      }

      var prevComponent = orderedSelection[i - 1];

      if (prevComponent && prevSibling === prevComponent.view.el)
      {
        continue;
      }

      componentsEl.insertBefore(componentEl, prevSibling);

      componentsList.splice(selection.index, 1);
      componentsList.splice(selection.index - 1, 0, selection.model);
    }
  };

  ViewportView.prototype.sendSelectionToBack = function()
  {
    var componentsList = this.model.screen.components.models;
    var componentsEl = this.els.components;
    var orderedSelection = this.getOrderedSelection();
    var i;
    var selection;

    for (i = orderedSelection.length - 1; i >= 0; --i)
    {
      selection = orderedSelection[i];

      componentsList.splice(selection.index, 1);
      componentsEl.removeChild(selection.view.el);
    }

    var firstEl = componentsEl.firstElementChild;

    for (i = 0; i < orderedSelection.length; ++i)
    {
      selection = orderedSelection[i];

      componentsList.splice(i, 0, selection.model);
      componentsEl.insertBefore(orderedSelection[i].view.el, firstEl);
    }
  };

  ViewportView.prototype.bringSelectionToFront = function()
  {
    var componentsList = this.model.screen.components.models;
    var componentsEl = this.els.components;
    var orderedSelection = this.getOrderedSelection();
    var i;

    for (i = orderedSelection.length - 1; i >= 0; --i)
    {
      componentsList.splice(orderedSelection[i].index, 1);
    }

    for (i = 0; i < orderedSelection.length; ++i)
    {
      var selection = orderedSelection[i];

      componentsList.push(selection.model);
      componentsEl.appendChild(selection.view.el);
    }
  };

  /**
   * @private
   * @returns {Array<Object>}
   */
  ViewportView.prototype.getOrderedSelection = function()
  {
    var allComponents = this.model.screen.components.models;
    var unorderedSelectedComponents = this.model.selection.models;

    if (unorderedSelectedComponents.length === allComponents.length)
    {
      return [];
    }

    if (unorderedSelectedComponents.length === 1)
    {
      var componentModel = unorderedSelectedComponents[0];
      var componentIndex = allComponents.indexOf(componentModel);

      return [{
        index: componentIndex,
        model: componentModel,
        view: this.components[componentModel.id]
      }];
    }

    var orderedSelection = [];

    for (var i = 0; i < allComponents.length; ++i)
    {
      var component = allComponents[i];

      if (unorderedSelectedComponents.indexOf(component) === -1)
      {
        continue;
      }

      orderedSelection.push({
        index: i,
        model: component,
        view: this.components[component.id]
      });

      if (orderedSelection.length === unorderedSelectedComponents.length)
      {
        break;
      }
    }

    return orderedSelection;
  };

  /**
   * @private
   */
  ViewportView.prototype.updateBackground = function()
  {
    this.els.inner.style.background = this.getBackgroundStyle();
  };

  /**
   * @private
   * @returns {string}
   */
  ViewportView.prototype.getBackgroundStyle = function()
  {
    var viewport = this.model;
    var background = viewport.screen.getBackground(viewport.scale);

    if (viewport.grid.enabled)
    {
      return viewport.getGridBackgroundImage() + ', ' + background;
    }

    return background;
  };

  /**
   * @private
   */
  ViewportView.prototype.onWindowResize = function()
  {
    this.resizeContainer();
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.onWindowMouseMove = function(e)
  {
    var viewport = this.model;

    viewport.lastMouseEvent = e;

    if (viewport.isInteracting())
    {
      e.preventDefault();

      this.handleScrolling();
    }

    this.handleWindowMouseMove(e);
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.handleWindowMouseMove = function(e)
  {
    var viewport = this.model;

    if (viewport.panning.enabled)
    {
      this.handlePanning(e);
    }
    else if (viewport.selecting.enabled)
    {
      this.handleSelecting(e);
    }
    else if (viewport.dragging.enabled)
    {
      this.handleDragging(e);
    }
    else if (viewport.resizing.enabled)
    {
      this.handleResizing(e);
    }
    else if (viewport.dropping.enabled)
    {
      this.handleDropping(e);
    }
    else if (this.shouldStartDragging(e))
    {
      this.startDragging(e);
    }
    else if (this.shouldStartDropping(e))
    {
      this.startDropping(e);
    }
  };

  /**
   * @private
   * @param {MouseEvent} e
   * @returns {boolean}
   */
  ViewportView.prototype.shouldStartDragging = function(e)
  {
    var startOnMove = this.model.dragging.startOnMove;

    if (!startOnMove || !this.down.left)
    {
      return false;
    }

    var dX = Math.abs(e.pageX - startOnMove.pageX);
    var dY = Math.abs(e.pageY - startOnMove.pageY);

    return dX >= DRAGGING_START_THRESHOLD || dY >= DRAGGING_START_THRESHOLD;
  };

  /**
   * @private
   * @param {MouseEvent} e
   * @returns {boolean}
   */
  ViewportView.prototype.shouldStartDropping = function(e)
  {
    var startOnMove = this.model.dropping.startOnMove;

    if (!startOnMove)
    {
      return false;
    }

    var dX = Math.abs(e.pageX - startOnMove.pageX);
    var dY = Math.abs(e.pageY - startOnMove.pageY);

    return dX >= DROPPING_START_THRESHOLD || dY >= DROPPING_START_THRESHOLD;
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.onWindowMouseUp = function(e)
  {
    this.updateMouseDown(e.button, false);

    var viewport = this.model;

    viewport.lastMouseEvent = e;

    if (e.button === 2)
    {
      if (viewport.panning.enabled)
      {
        this.stopScrolling();
        this.stopPanning();
      }
    }

    if (e.button === 0)
    {
      viewport.dragging.startOnMove = null;
      viewport.selection.lastAdded = null;

      if (viewport.dropping.enabled)
      {
        this.stopScrolling();
        this.stopDropping();
      }
      else if (viewport.dropping.startOnMove)
      {
        this.handleDropOnClick(e);
      }
      else if (viewport.panning.enabled)
      {
        this.stopScrolling();
        this.stopPanning();
      }
      else if (viewport.selecting.enabled)
      {
        this.stopScrolling();
        this.stopSelecting();
      }
      else if (viewport.resizing.enabled)
      {
        this.stopScrolling();
        this.stopResizing();
      }
      else if (viewport.dragging.enabled)
      {
        this.stopScrolling();
        this.stopDragging();
      }
    }
  };

  /**
   * @private
   * @param {KeyboardEvent} e
   */
  ViewportView.prototype.onWindowKeyDown = function(e)
  {
    var viewport = this.model;
    var active = viewport.active;

    this.updateKeysDown(e);

    if (active && e.ctrlKey)
    {
      // Prevent the default Ctrl key functionality (zoom, print...).
      e.preventDefault();

      // Reset zoom on Ctrl+0
      if (e.keyCode === 48)
      {
        viewport.zoomTo(1);
      }
      // Zoom in on Ctrl+=
      else if (e.keyCode === 187)
      {
        viewport.zoomIn();
      }
      // Zoom out on Ctrl+-
      else if (e.keyCode === 189)
      {
        viewport.zoomOut();
      }
      // (De)Select all components on Ctrl(+Alt)+A
      else if (e.keyCode === 65)
      {
        if (e.altKey)
        {
          this.model.selection.reset();
        }
        else
        {
          this.model.selection.add(this.model.screen.components.models);
        }
      }
      // Toggle grid on Ctrl+G
      else if (e.keyCode === 71)
      {
        this.model.toggleGrid();
      }
    }

    var hasActiveElement = !this.hasNoActiveElement();

    if (e.keyCode === 8 && !hasActiveElement) // Backspace
    {
      // Prevent the browser going back in history.
      e.preventDefault();
    }

    if (!this.hasNoActiveElement())
    {
      return;
    }

    if (e.keyCode === 32) // Space
    {
      // Prevent the viewport scrolling while holding the Space key.
      e.preventDefault();

      if (active && !viewport.isInteracting() || viewport.panning.enabled)
      {
        viewport.forcePanning(true);
      }
    }
    else if (active && e.keyCode >= 37 && e.keyCode <= 40)
    {
      this.handleArrowKeyDown(e);
    }
    else if (active && e.keyCode >= 33 && e.keyCode <= 36)
    {
      // Prevent the viewport scrolling by PageUp/PageDown/Home/End.
      e.preventDefault();

      this.handleZIndexKeyDown(e);
    }
    else if (active && e.keyCode === 46) // Delete
    {
      this.model.deleteSelection();
    }
  };

  /**
   * @private
   * @param {KeyboardEvent} e
   */
  ViewportView.prototype.handleArrowKeyDown = function(e)
  {
    var viewport = this.model;

    if (viewport.selection.isEmpty() || !this.hasNoActiveElement())
    {
      return;
    }

    e.preventDefault();

    var dX = 0;
    var dY = 0;

    switch (e.keyCode)
    {
      case 37: // Left
        dX = -1;
        break;

      case 38: // Up
        dY = -1;
        break;

      case 39: // Right
        dX = 1;
        break;

      case 40: // Down
        dY = 1;
        break;
    }

    if (e.shiftKey)
    {
      dX *= this.model.grid.width;
      dY *= this.model.grid.height;
    }

    if (e.altKey)
    {
      this.resizeSelectionBy(dX, dY);
    }
    else
    {
      this.moveSelectionBy(dX, dY);
    }
  };

  /**
   * @private
   * @param {KeyboardEvent} e
   */
  ViewportView.prototype.handleZIndexKeyDown = function(e)
  {
    var viewport = this.model;

    if (viewport.selection.isEmpty() || !this.hasNoActiveElement())
    {
      return;
    }

    switch (e.keyCode)
    {
      case 33: // PageUp
        this.bringSelectionForward();
        break;

      case 34: // PageDown
        this.sendSelectionBackward();
        break;

      case 35: // End
        this.sendSelectionToBack();
        break;

      case 36: // Home
        this.bringSelectionToFront();
        break;
    }
  };

  /**
   * @private
   * @returns {boolean}
   */
  ViewportView.prototype.hasNoActiveElement = function()
  {
    return !document.activeElement || document.activeElement === document.body;
  };

  /**
   * @private
   * @param {KeyboardEvent} e
   */
  ViewportView.prototype.onWindowKeyUp = function(e)
  {
    var viewport = this.model;

    this.updateKeysDown(e);

    if (e.keyCode === 32 || !this.hasNoActiveElement())
    {
      viewport.forcePanning(false);
    }
  };

  /**
   * @private
   */
  ViewportView.prototype.onOuterMouseEnter = function()
  {
    this.stopScrolling();
  };

  /**
   * @private
   */
  ViewportView.prototype.onOuterMouseLeave = function(e)
  {
    var viewport = this.model;

    if (viewport.isInteracting() && !viewport.panning.enabled)
    {
      this.startScrolling();
    }
  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ViewportView.prototype.onOuterMouseDown = function(e)
  {
    this.updateMouseDown(e.button, true);

    if (e.button === 2 || (e.button === 0 && this.model.panning.forced))
    {
      this.startPanning(e);
    }
    else if (e.button === 0)
    {
      this.startSelecting(e);
    }
  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ViewportView.prototype.onOuterContextMenu = function(e)
  {
    e.preventDefault();
  };

  /**
   * @private
   * @param {jQuery.Event<WheelEvent>} e
   */
  ViewportView.prototype.onOuterWheel = function(e)
  {
    e.preventDefault();

    if (e.ctrlKey)
    {
      this.handleWheelZooming(e.originalEvent);
    }
    else
    {
      this.handleWheelScrolling(e.originalEvent);
    }
  };

  /**
   * @private
   * @param {number} layerX
   * @returns {number}
   */
  ViewportView.prototype.getOriginX = function(layerX)
  {
    return (layerX - OUTER_PADDING_H - INNER_BORDER_WIDTH) / this.model.scale;
  };

  /**
   * @private
   * @param {number} layerY
   * @returns {number}
   */
  ViewportView.prototype.getOriginY = function(layerY)
  {
    return (layerY - OUTER_PADDING_V - INNER_BORDER_WIDTH) / this.model.scale;
  };

  /**
   * @private
   * @param {number} originX
   * @returns {number}
   */
  ViewportView.prototype.getLayerX = function(originX)
  {
    return originX * this.model.scale + OUTER_PADDING_H + INNER_BORDER_WIDTH;
  };

  /**
   * @private
   * @param {number} originY
   * @returns {number}
   */
  ViewportView.prototype.getLayerY = function(originY)
  {
    return originY * this.model.scale + OUTER_PADDING_V + INNER_BORDER_WIDTH;
  };

  /**
   * @private
   * @param {number} pageX
   * @returns {number}
   */
  ViewportView.prototype.getOuterLayerX = function(pageX)
  {
    return pageX + this.els.container.scrollLeft - this.els.container.getBoundingClientRect().left;
  };

  /**
   * @private
   * @param {number} pageY
   * @returns {number}
   */
  ViewportView.prototype.getOuterLayerY = function(pageY)
  {
    return pageY + this.els.container.scrollTop - this.els.container.getBoundingClientRect().top;
  };

  /**
   * @private
   * @param {WheelEvent} e
   */
  ViewportView.prototype.handleWheelZooming = function(e)
  {
    var viewport = this.model;
    var containerRect = this.els.container.getBoundingClientRect();
    var offsetLeft = e.pageX - containerRect.left - CONTAINER_BORDER_WIDTH;
    var offsetTop = e.pageY - containerRect.top - CONTAINER_BORDER_WIDTH;
    var originX = this.getOriginX(e.layerX);
    var originY = this.getOriginY(e.layerY);

    if (e.deltaX < 0 || e.deltaY < 0)
    {
      viewport.zoomIn();
    }
    else
    {
      viewport.zoomOut();
    }

    var newScrollLeft = this.getLayerX(originX) - offsetLeft;
    var newScrollTop = this.getLayerY(originY) - offsetTop;

    this.scrollTo(Math.round(newScrollLeft), Math.round(newScrollTop));
  };

  /**
   * @private
   * @param {WheelEvent} e
   */
  ViewportView.prototype.handleWheelScrolling = function(e)
  {
    var d = e.deltaX < 0 || e.deltaY < 0 ? -100 : 100;
    var dX;
    var dY;

    if (e.shiftKey)
    {
      dX = d;
      dY = 0;
    }
    else
    {
      dX = 0;
      dY = d;
    }

    this.scrollBy(dX, dY);
  };

  /**
   * @private
   */
  ViewportView.prototype.onContainerScroll = function()
  {
    this.model.scrollContainer(
      this.els.container.scrollLeft,
      this.els.container.scrollTop
    );
  };

  /**
   * @private
   */
  ViewportView.prototype.onContainerScrolled = function()
  {
    var viewport = this.model;
    var lastMouseEvent = viewport.lastMouseEvent;

    if (viewport.selecting.enabled)
    {
      this.handleSelecting(lastMouseEvent);
    }
    else if (viewport.resizing.enabled)
    {
      this.handleResizing(lastMouseEvent);
    }
    else if (viewport.dragging.enabled)
    {
      this.handleDragging(lastMouseEvent);
    }
    else if (viewport.dropping.enabled)
    {
      this.handleDropping(lastMouseEvent);
    }
  };

  /**
   * @private
   */
  ViewportView.prototype.onPanningForced = function()
  {
    this.$el.toggleClass('is-panning-forced', this.model.panning.forced);
  };

  /**
   * @private
   */
  ViewportView.prototype.onZoomed = function()
  {
    var viewport = this.model;
    var screen = viewport.screen;
    var scale = viewport.scale;
    var width = screen.get('width') * scale;
    var height = screen.get('height') * scale;
    var els = this.els;
    var containerEl = els.container;
    var scrollLeftRatio = containerEl.scrollLeft / containerEl.scrollWidth;
    var scrollTopRatio = containerEl.scrollTop / containerEl.scrollHeight;

    els.canvas.setAttribute('width', width + '');
    els.canvas.setAttribute('height', height + '');
    els.inner.style.width = (width + INNER_BORDER_WIDTH * 2) + 'px';
    els.inner.style.height = (height + INNER_BORDER_WIDTH * 2) + 'px';
    els.outer.style.width = (width + INNER_BORDER_WIDTH * 2 + OUTER_PADDING_H * 2) + 'px';
    els.outer.style.height = (height + INNER_BORDER_WIDTH * 2 + OUTER_PADDING_V * 2) + 'px';

    this.updateComponentsScale();
    this.updateComponentsSelection();

    containerEl.scrollLeft = containerEl.scrollWidth * scrollLeftRatio;
    containerEl.scrollTop = containerEl.scrollHeight * scrollTopRatio;

    this.handleWindowMouseMove(viewport.lastMouseEvent);

    viewport.resetGridBackgroundImage();

    this.updateBackground();
  };

  /**
   * @private
   */
  ViewportView.prototype.onGridToggled = function()
  {
    this.updateBackground();
  };

  /**
   * @private
   * @param {ScreenComponent} component
   */
  ViewportView.prototype.onComponentAdd = function(component)
  {
    this.renderComponent(component);
  };

  /**
   * @private
   * @param {ScreenComponent} component
   */
  ViewportView.prototype.onComponentRemove = function(component)
  {
    var componentView = this.components[component.id];

    if (!componentView)
    {
      return;
    }

    this.model.selection.remove(component);

    delete this.components[component.id];

    componentView.remove();
  };

  /**
   * @private
   * @param {jQuery.Event<MouseEvent>} e
   */
  ViewportView.prototype.onComponentMouseDown = function(e)
  {
    var viewport = this.model;

    if (e.button === 0 && !viewport.panning.forced)
    {
      e.preventDefault();
      e.stopPropagation();

      this.updateMouseDown(e.button, true);

      viewport.selection.lastAdded = this.select(e.currentTarget.getAttribute('data-component-id'), e.ctrlKey);

      viewport.dragging.startOnMove = {
        pageX: e.pageX,
        pageY: e.pageY,
        layerX: e.originalEvent.layerX,
        layerY: e.originalEvent.layerY
      };
    }
  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ViewportView.prototype.onComponentMouseUp = function(e)
  {
    var viewport = this.model;

    if (e.button === 0 && !viewport.isInteracting())
    {
      var selection = viewport.selection;
      var component = selection.get(e.currentTarget.getAttribute('data-component-id'));

      if (component && e.ctrlKey && selection.lastAdded !== component)
      {
        selection.remove(component);
      }
      else if (component && selection.length > 1 && !e.ctrlKey)
      {
        selection.reset([component]);
      }
    }
  };

  /**
   * @private
   * @param {ScreenComponent} component
   */
  ViewportView.prototype.onComponentResize = function(component)
  {
    var viewport = this.model;
    var resizing = viewport.resizing;

    if (resizing.enabled)
    {
      var scale = viewport.scale;
      var x = component.get('x') * scale;
      var y = component.get('y') * scale;
      var w = component.get('width') * scale;
      var h = component.get('height') * scale;
      var resizeHandle = this.createResizeHandle(resizing.direction, x, y, w, h);

      resizeHandle.visible = true;

      this.updateResizeHandlePosition(resizing.handleEl, resizeHandle);
    }
    else if (viewport.selection.get(component))
    {
      this.updateComponentSelection(component);
    }
  };

  /**
   * @private
   * @param {ScreenComponent} component
   */
  ViewportView.prototype.onComponentMove = function(component)
  {
    this.updateComponentSelection(component);
  };

  /**
   * @private
   * @param {EditorSelection} selection
   * @param {{previousModels: Array<ScreenComponent>}} options
   */
  ViewportView.prototype.onSelectionReset = function(selection, options)
  {
    if (options.previousModels.length)
    {
      clearSvgElement(this.els.selection);
    }

    if (selection.length)
    {
      selection.forEach(this.onSelectionAdd, this);
    }
  };

  /**
   * @private
   * @param {ScreenComponent} component
   */
  ViewportView.prototype.onSelectionAdd = function(component)
  {
    this.updateComponentSelection(component);
  };

  /**
   * @private
   * @param {ScreenComponent} component
   */
  ViewportView.prototype.onSelectionRemove = function(component)
  {
    this.els.$selection.find('[data-component-id="' + component.id + '"]').remove();
  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ViewportView.prototype.onResizeHandleMouseDown = function(e)
  {
    if (e.button === 0 && !this.model.panning.forced)
    {
      e.preventDefault();

      this.updateMouseDown(e.button, true);
      this.startResizing(e);
    }
  };

  /**
   * @private
   * @param {number} button
   * @param {boolean} state
   */
  ViewportView.prototype.updateMouseDown = function(button, state)
  {
    var down = this.down;

    if (button === 0)
    {
      down.left = state;
    }
    else if (button === 1)
    {
      down.middle = state;
    }
    else if (button === 2)
    {
      down.right = state;
    }
  };

  /**
   * @private
   * @param {{altKey: boolean, ctrlKey: boolean, shiftKey: boolean}} e
   */
  ViewportView.prototype.updateKeysDown = function(e)
  {
    this.down.ctrl = e.ctrlKey;
    this.down.shift = e.shiftKey;
    this.down.alt = e.altKey;
  };

  /**
   * @private
   */
  ViewportView.prototype.updateComponentsScale = function()
  {
    _.forEach(this.components, function(component)
    {
      component.scale();
    });
  };

  /**
   * @private
   */
  ViewportView.prototype.updateComponentsSelection = function()
  {
    var selection = this.model.selection.models;

    for (var i = 0; i < selection.length; ++i)
    {
      this.updateComponentSelection(selection[i]);
    }
  };

  /**
   * @private
   * @param {ScreenComponent} component
   */
  ViewportView.prototype.updateComponentSelection = function(component)
  {
    var selectionEl = this.els.selection;
    var existingEls = selectionEl.querySelectorAll('[data-component-id="' + component.id + '"]');
    var update = existingEls.length > 0;
    var scale = this.model.scale;
    var x = component.get('x') * scale;
    var y = component.get('y') * scale;
    var w = component.get('width') * scale;
    var h = component.get('height') * scale;
    var resizeHandles = [
      this.createResizeHandle('n', x, y, w, h),
      this.createResizeHandle('nw', x, y, w, h),
      this.createResizeHandle('ne', x, y, w, h),
      this.createResizeHandle('w', x, y, w, h),
      this.createResizeHandle('e', x, y, w, h),
      this.createResizeHandle('s', x, y, w, h),
      this.createResizeHandle('sw', x, y, w, h),
      this.createResizeHandle('se', x, y, w, h)
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

      var resizing = this.model.resizing;
      var currentDirection = resizing.enabled ? resizing.direction : null;

      g.style.display = resizeHandle.visible || resizeHandle.direction === currentDirection ? '' : 'none';

      selectionEl.appendChild(g);
    }
  };

  /**
   * @private
   * @param {SVGGraphicsElement} handleEl
   * @param {{x: number, y: number, visible: boolean}} resizeHandle
   */
  ViewportView.prototype.updateResizeHandlePosition = function(handleEl, resizeHandle)
  {
    for (var circleI = 0; circleI < 3; ++circleI)
    {
      var circleEl = handleEl.children[circleI];

      circleEl.setAttribute('cx', resizeHandle.x);
      circleEl.setAttribute('cy', resizeHandle.y);
    }

    var resizing = this.model.resizing;

    handleEl.style.display = resizeHandle.visible || (resizing.enabled && resizing.handleEl === handleEl) ? '' : 'none';
  };

  /**
   * @private
   * @param {string} direction
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @returns {{direction: string, x: number, y: number, visible: boolean}}
   */
  ViewportView.prototype.createResizeHandle = function(direction, x, y, w, h)
  {
    var resizeHandle = {
      direction: direction,
      x: x,
      y: y,
      visible: true
    };

    switch (direction)
    {
      case 'nw':
        resizeHandle.visible = w >= 30 && h >= 30;
        break;

      case 'n':
        resizeHandle.x += w / 2;
        resizeHandle.visible = w >= 50 && h >= 30;
        break;

      case 'ne':
        resizeHandle.x += w;
        resizeHandle.visible = w >= 30 && h >= 30;
        break;

      case 'e':
        resizeHandle.x += w;
        resizeHandle.y += h / 2;
        resizeHandle.visible = w >= 30 && h >= 50;
        break;

      case 'se':
        resizeHandle.x += w;
        resizeHandle.y += h;
        break;

      case 's':
        resizeHandle.x += w / 2;
        resizeHandle.y += h;
        resizeHandle.visible = w >= 50 && h >= 30;
        break;

      case 'sw':
        resizeHandle.y += h;
        resizeHandle.visible = w >= 30 && h >= 30;
        break;

      case 'w':
        resizeHandle.y += h / 2;
        resizeHandle.visible = w >= 30 && h >= 50;
        break;
    }

    return resizeHandle;
  };

  /**
   * @private
   */
  ViewportView.prototype.resizeContainer = function()
  {
    this.model.resizeContainer(this.els.container.getBoundingClientRect());
  };

  /**
   * @private
   */
  ViewportView.prototype.startScrolling = function()
  {
    var scrolling = this.model.scrolling;

    if (scrolling.enabled)
    {
      return;
    }

    scrolling.enabled = true;
    scrolling.interval = setInterval(this.handleScrolling, 1000 / 60);
  };

  /**
   * @private
   */
  ViewportView.prototype.handleScrolling = function()
  {
    var viewport = this.model;

    if (!viewport.scrolling.enabled)
    {
      return;
    }

    var containerRect = this.els.container.getBoundingClientRect();
    var mouseEvent = viewport.lastMouseEvent;
    var padding = 25;
    var deltaX = 0;
    var deltaY = 0;

    if (mouseEvent.pageX <= containerRect.left + padding)
    {
      deltaX = -Math.abs(containerRect.left - mouseEvent.pageX);
    }
    else if (mouseEvent.pageX >= containerRect.right - padding)
    {
      deltaX = Math.abs(mouseEvent.pageX - containerRect.right);
    }

    if (mouseEvent.pageY <= containerRect.top + padding)
    {
      deltaY = -Math.abs(containerRect.top - mouseEvent.pageY);
    }
    else if (mouseEvent.pageY >= containerRect.bottom - padding)
    {
      deltaY = Math.abs(mouseEvent.pageY - containerRect.bottom);
    }

    deltaX = this.scaleScrollingDelta(deltaX);
    deltaY = this.scaleScrollingDelta(deltaY);

    this.scrollBy(deltaX, deltaY);
  };

  /**
   * @private
   * @param {number} delta
   * @returns {number}
   */
  ViewportView.prototype.scaleScrollingDelta = function(delta)
  {
    var abs = Math.abs(delta);

    if (abs === 0)
    {
      return 0;
    }

    var min = 5;
    var max = 300;

    return Math.round(Math.min(max, Math.max(min, Math.abs(delta))) * 100 / max + min) * (delta < 0 ? -1 : 1);
  };

  /**
   * @private
   */
  ViewportView.prototype.stopScrolling = function()
  {
    var scrolling = this.model.scrolling;

    if (!scrolling.enabled)
    {
      return;
    }

    clearInterval(scrolling.interval);
    scrolling.interval = -1;
    scrolling.enabled = false;
  };

  /**
   * @private
   */
  ViewportView.prototype.resizeCanvas = function()
  {
    this.model.resizeCanvas(this.els.canvas);
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.startPanning = function(e)
  {
    var viewport = this.model;

    if (viewport.isInteracting())
    {
      return;
    }

    var panning = viewport.panning;

    panning.enabled = true;
    panning.x = e.pageX;
    panning.y = e.pageY;

    this.$el.addClass('is-panning');
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.handlePanning = function(e)
  {
    var panning = this.model.panning;
    var x = e.pageX;
    var y = e.pageY;
    var deltaX = -(x - panning.x);
    var deltaY = -(y - panning.y);

    this.scrollBy(deltaX, deltaY);

    panning.x = x;
    panning.y = y;
  };

  /**
   * @private
   */
  ViewportView.prototype.stopPanning = function()
  {
    var panning = this.model.panning;

    if (!panning.enabled)
    {
      return;
    }

    panning.enabled = false;

    this.$el.removeClass('is-panning');
  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ViewportView.prototype.startSelecting = function(e)
  {
    var viewport = this.model;

    if (viewport.isInteracting())
    {
      return;
    }

    var selecting = viewport.selecting;

    selecting.enabled = true;
    selecting.startX = this.getOriginX(e.originalEvent.layerX);
    selecting.startY = this.getOriginY(e.originalEvent.layerY);
    selecting.stopX = selecting.startX;
    selecting.stopY = selecting.startY;

    if (!e.ctrlKey)
    {
      this.model.selection.reset();
    }

    this.updateSelectionBox();

    this.els.$outer.addClass('is-selecting');
  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ViewportView.prototype.handleSelecting = function(e)
  {
    var selecting = this.model.selecting;

    if (!selecting.enabled)
    {
      return;
    }

    var containerRect = this.els.container.getBoundingClientRect();

    selecting.stopX = this.getOriginX(this.getOuterLayerX(e.pageX));
    selecting.stopY = this.getOriginY(this.getOuterLayerY(e.pageY));

    this.updateSelectionBox();
  };

  /**
   * @private
   */
  ViewportView.prototype.stopSelecting = function()
  {
    var selecting = this.model.selecting;

    if (!selecting.enabled)
    {
      return;
    }

    selecting.enabled = false;

    this.els.$outer.removeClass('is-selecting');

    var startX = selecting.startX;
    var startY = selecting.startY;
    var stopX = selecting.stopX;
    var stopY = selecting.stopY;
    var intersect = startX > stopX;
    var swap;

    if (intersect)
    {
      swap = startX;
      startX = stopX;
      stopX = swap;
    }

    if (startY > stopY)
    {
      swap = startY;
      startY = stopY;
      stopY = swap;
    }

    var width = Math.abs(stopX - startX);
    var height = Math.abs(stopY - startY);

    var allComponents = this.model.screen.components.models;
    var selectedComponents = [];

    var i;

    for (i = 0; i < allComponents.length; ++i)
    {
      var component = allComponents[i];

      if (this.shouldSelectComponent(component, startX, startY, width, height, intersect))
      {
        selectedComponents.push(component);
      }
    }

    var selection = this.model.selection;
    var toAdd = selectedComponents;
    var toRemove = [];

    if (this.down.ctrl)
    {
      if (this.down.shift)
      {
        toAdd = [];

        for (i = 0; i < selectedComponents.length; ++i)
        {
          var selectedComponent = selectedComponents[i];

          if (selection.contains(selectedComponent))
          {
            toRemove.push(selectedComponent);
          }
          else
          {
            toAdd.push(selectedComponent);
          }
        }
      }
    }
    else if (this.down.shift)
    {
      toRemove = selectedComponents;
      toAdd = _.difference(allComponents, selectedComponents);
    }
    else
    {
      toRemove = _.difference(selection.models, selectedComponents);
    }

    for (i = 0; i < toRemove.length; ++i)
    {
      selection.remove(toRemove[i]);
    }

    for (i = 0; i < toAdd.length; ++i)
    {
      selection.add(toAdd[i]);
    }
  };

  /**
   * @private
   * @param {ScreenComponent} component
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {boolean} intersect
   * @returns {boolean}
   */
  ViewportView.prototype.shouldSelectComponent = function(component, x, y, w, h, intersect)
  {
    var x2 = component.get('x');
    var y2 = component.get('y');
    var w2 = component.get('width');
    var h2 = component.get('height');

    if (intersect)
    {
      return !((x2 + w2 <= x) || (y2 + h2 <= y) || (x2 >= x + w) || (y2 >= y + h));
    }

    return (x2 >= x) && (y2 >= y) && (x2 + w2 <= x + w) && (y2 + h2 <= y + h);
  };

  /**
   * @private
   */
  ViewportView.prototype.updateSelectionBox = function()
  {
    var selectionBoxStyle = this.els.selectionBox.style;
    var selecting = this.model.selecting;
    var left = this.getLayerX(selecting.startX);
    var top = this.getLayerY(selecting.startY);
    var deltaX = this.getLayerX(selecting.stopX) - left;
    var deltaY = this.getLayerY(selecting.stopY) - top;
    var width = Math.abs(deltaX);
    var height = Math.abs(deltaY);

    if (deltaX < 0)
    {
      left += deltaX;
    }

    if (deltaY < 0)
    {
      top += deltaY;
    }

    selecting.top = top;
    selecting.left = left;
    selecting.width = width;
    selecting.height = height;

    selectionBoxStyle.top = top + 'px';
    selectionBoxStyle.left = left + 'px';
    selectionBoxStyle.width = width + 'px';
    selectionBoxStyle.height = height + 'px';
  };

  /**
   * @private
   * @param {jQuery.Event} e
   */
  ViewportView.prototype.startResizing = function(e)
  {
    var resizing = this.model.resizing;
    var resizeHandleEl = e.currentTarget;
    var component = this.model.screen.components.get(resizeHandleEl.getAttribute('data-component-id'));

    resizing.enabled = true;
    resizing.x = e.originalEvent.layerX;
    resizing.y = e.originalEvent.layerY;
    resizing.top = component.get('y');
    resizing.bottom = resizing.top + component.get('height');
    resizing.left = component.get('x');
    resizing.right = resizing.left + component.get('width');
    resizing.component = component;
    resizing.handleEl = resizeHandleEl;
    resizing.direction = resizeHandleEl.getAttribute('data-direction');

    resizeHandleEl.classList.add('is-active');

    this.$el.addClass('is-resizing');
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.handleResizing = function(e)
  {
    var resizing = this.model.resizing;
    var containerRect = this.els.container.getBoundingClientRect();
    var x = e.pageX + this.els.container.scrollLeft - containerRect.left;
    var y = e.pageY + this.els.container.scrollTop - containerRect.top;

    if (x === resizing.x && y === resizing.y)
    {
      return;
    }

    var scale = this.model.scale;
    var dX = (x - resizing.x) / scale;
    var dY = (y - resizing.y) / scale;

    resizing.x = x;
    resizing.y = y;

    switch (resizing.direction)
    {
      case 'nw':
        resizing.top += dY;
        resizing.left += dX;
        break;

      case 'n':
        resizing.top += dY;
        break;

      case 'ne':
        resizing.top += dY;
        resizing.right += dX;
        break;

      case 'e':
        resizing.right += dX;
        break;

      case 'se':
        resizing.bottom += dY;
        resizing.right += dX;
        break;

      case 's':
        resizing.bottom += dY;
        break;

      case 'sw':
        resizing.bottom += dY;
        resizing.left += dX;
        break;

      case 'w':
        resizing.left += dX;
        break;
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

    resizing.component.resizeTo(resizing.left, resizing.top, width, height);
  };

  /**
   * @private
   */
  ViewportView.prototype.stopResizing = function()
  {
    var resizing = this.model.resizing;

    if (!resizing.enabled)
    {
      return;
    }

    var component = resizing.component;

    resizing.handleEl.classList.remove('is-active');

    resizing.enabled = false;
    resizing.component = null;
    resizing.handleEl = null;

    this.updateComponentSelection(component);

    this.$el.removeClass('is-resizing');
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.startDragging = function(e)
  {
    var dragging = this.model.dragging;
    var startOnMove = dragging.startOnMove;

    dragging.enabled = true;
    dragging.startOnMove = null;
    dragging.x = startOnMove.layerX;
    dragging.y = startOnMove.layerY;

    this.$el.addClass('is-dragging');

    this.handleDragging(e);
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.handleDragging = function(e)
  {
    var dragging = this.model.dragging;
    var containerRect = this.els.container.getBoundingClientRect();
    var x = e.pageX + this.els.container.scrollLeft - containerRect.left;
    var y = e.pageY + this.els.container.scrollTop - containerRect.top;

    if (x === dragging.x && y === dragging.y)
    {
      return;
    }

    // TODO: fix dragging while zoomed in

    var scale = this.model.scale;
    var dX = (x - dragging.x) / scale;
    var dY = (y - dragging.y) / scale;
    var nX = dX < 0;
    var nY = dY < 0;

    dX = Math.round(Math.abs(dX));
    dY = Math.round(Math.abs(dY));

    if (dX !== 0 || dY !== 0)
    {
      if (nX)
      {
        dX *= -1;
      }

      if (nY)
      {
        dY *= -1;
      }

      this.moveSelectionBy(dX, dY);

      dragging.x = x;
      dragging.y = y;
    }
  };

  /**
   * @private
   */
  ViewportView.prototype.stopDragging = function()
  {
    var dragging = this.model.dragging;

    if (!dragging.enabled)
    {
      return;
    }

    dragging.enabled = false;

    this.$el.removeClass('is-dragging');
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.startDropping = function(e)
  {
    var dropping = this.model.dropping;

    dropping.enabled = true;
    dropping.startOnMove = null;
    dropping.inside = false;
    dropping.component = this.createComponent(dropping.type);
    dropping.$ghost = $('<div class="screenEditor-ghost"></div>').css({
      left: e.pageX + 'px',
      top: e.pageY + 'px',
      width: dropping.component.get('width') + 'px',
      height: dropping.component.get('height') + 'px'
    });

    dropping.$ghost.appendTo(document.body);

    this.$el.addClass('is-dropping');

    this.handleDropping(e);
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.handleDropping = function(e)
  {
    var viewport = this.model;
    var dropping = viewport.dropping;
    var scale = viewport.scale;
    var ghostEl = dropping.$ghost[0];

    if (!dropping.inside)
    {
      if (!this.isMouseInside(e))
      {
        ghostEl.style.left = e.pageX + 'px';
        ghostEl.style.top = e.pageY + 'px';

        return;
      }

      dropping.inside = true;
      dropping.$ghost.appendTo(this.els.outer);
    }

    dropping.dropX = this.getOuterLayerX(e.pageX);
    dropping.dropY = this.getOuterLayerY(e.pageY);

    ghostEl.style.left = dropping.dropX + 'px';
    ghostEl.style.top = dropping.dropY + 'px';
    ghostEl.style.width = dropping.component.get('width') * scale + 'px';
    ghostEl.style.height = dropping.component.get('height') * scale + 'px';
  };

  /**
   * @private
   * @param {MouseEvent} e
   * @returns {boolean}
   */
  ViewportView.prototype.isMouseInside = function(e)
  {
    var containerRect = this.els.container.getBoundingClientRect();

    return e.pageX > containerRect.left
      && e.pageY > containerRect.top
      && e.pageX < containerRect.right
      && e.pageY < containerRect.bottom;
  };

  /**
   * @private
   */
  ViewportView.prototype.stopDropping = function()
  {
    var viewport = this.model;
    var dropping = viewport.dropping;

    if (!dropping.enabled)
    {
      return;
    }

    var component = dropping.component;

    dropping.$ghost.remove();

    dropping.enabled = false;
    dropping.component = null;
    dropping.$ghost = null;

    this.$el.removeClass('is-dropping');

    if (!dropping.inside)
    {
      return;
    }

    component.moveTo(
      this.getOriginX(dropping.dropX),
      this.getOriginY(dropping.dropY)
    );

    viewport.screen.components.add(component);

    if (!this.down.ctrl)
    {
      viewport.selection.reset();
    }

    viewport.selection.add(component);
  };

  /**
   * @private
   * @param {MouseEvent} e
   */
  ViewportView.prototype.handleDropOnClick = function(e)
  {
    var dropping = this.model.dropping;

    if (!dropping.startOnMove)
    {
      return;
    }

    if (dropping.startOnMove.pageX === e.pageX && dropping.startOnMove.pageY === e.pageY)
    {
      this.model.screen.components.add(this.createComponent(dropping.type));
    }

    dropping.startOnMove = null;
  };

  /**
   * @private
   * @param {string} type
   * @returns {ScreenComponent}
   */
  ViewportView.prototype.createComponent = function(type)
  {
    /** @type {typeof ComponentView} */
    var ComponentView = require(type);

    return new ScreenComponent(_.extend(ComponentView.defaults(), {
      _id: uuid(),
      cid: this.model.getNextClientId(type),
      type: type
    }));
  };

  /**
   * @private
   * @param {number} dWidth
   * @param {number} dHeight
   */
  ViewportView.prototype.resizeSelectionBy = function(dWidth, dHeight)
  {
    var selection = this.model.selection.models;

    for (var i = 0; i < selection.length; ++i)
    {
      selection[i].resizeBy(dWidth, dHeight);
    }
  };

  /**
   * @private
   * @param {number} dX
   * @param {number} dY
   */
  ViewportView.prototype.moveSelectionBy = function(dX, dY)
  {
    var selection = this.model.selection.models;

    for (var i = 0; i < selection.length; ++i)
    {
      selection[i].moveBy(dX, dY);
    }
  };

  return ViewportView;
});
