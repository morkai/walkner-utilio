// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/core/Model',
  'app/screens/EditorSelection',
  'ejs!app/screens/templates/editor/gridL'
], function(
  Model,
  EditorSelection,
  gridLTemplate
) {
  'use strict';

  /**
   * @constructor
   * @extends {Model}
   * @param {?Object} attrs
   * @param {Object} options
   * @param {Screen} options.screen
   * @param {EditorSelection} [options.selection]
   * @param {boolean} [options.active]
   */
  function EditorViewport(attrs, options)
  {
    Model.apply(this, arguments);
window.ev = this;

    /**
     * @type {Screen}
     */
    this.screen = options.screen;

    /**
     * @type {EditorSelection}
     */
    this.selection = options.selection || new EditorSelection();

    /**
     * @type {boolean}
     */
    this.active = options.active || false;

    /**
     * @type {number}
     */
    this.scale = 1;

    /**
     * @type {?MouseEvent}
     */
    this.lastMouseEvent = null;

    this.scrolling = {
      enabled: false,
      interval: -1,
      left: 0,
      top: 0,
      dLeft: 0,
      dTop: 0
    };

    this.panning = {
      enabled: false,
      forced: false,
      x: 0,
      y: 0
    };

    this.selecting = {
      enabled: false,
      startX: 0,
      startY: 0,
      stopX: 0,
      stopY: 0
    };

    this.dragging = {
      enabled: false,
      startOnMove: null,
      x: 0,
      y: 0
    };

    this.dropping = {
      enabled: false,
      /** @type {?{pageX: number, pageY: number}} */
      startOnMove: null,
      type: null,
      inside: false,
      /** @type {jQuery} */
      $ghost: null,
      dropX: 0,
      dropY: 0
    };

    this.resizing = {
      enabled: false,
      /** @type {?string} */
      direction: null,
      x: 0,
      y: 0,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      /** @type {?ScreenComponent} */
      component: null,
      /** @type {?SVGGraphicsElement} */
      handleEl: null
    };

    this.grid = {
      enabled: true,
      minWidth: 4,
      minHeight: 4,
      steps: 5,
      width: 10,
      height: 10,
      color: '#E0E0E0',
      /** @type {?string} */
      backgroundImage: null
    };
  }

  inherits(EditorViewport, Model);

  /**
   * @returns {boolean}
   */
  EditorViewport.prototype.isInteracting = function()
  {
    return this.panning.enabled
      || this.selecting.enabled
      || this.dragging.enabled
      || this.dropping.enabled
      || this.resizing.enabled;
  };

  /**
   * @param {ClientRect} containerEl
   */
  EditorViewport.prototype.resizeContainer = function(containerEl)
  {
    this.trigger('containerResized');
  };

  /**
   * @param {number} newLeft
   * @param {number} newTop
   */
  EditorViewport.prototype.scrollContainer = function(newLeft, newTop)
  {
    var scrolling = this.scrolling;

    scrolling.dLeft = newLeft - scrolling.left;
    scrolling.dTop = newTop - scrolling.top;
    scrolling.left = newLeft;
    scrolling.top = newTop;

    this.trigger('containerScrolled');
  };

  EditorViewport.prototype.resizeCanvas = function(canvasEl)
  {
    this.trigger('canvasResized');
  };

  /**
   * @param {boolean} forced
   */
  EditorViewport.prototype.forcePanning = function(forced)
  {
    if (this.panning.forced === forced)
    {
      return;
    }

    this.panning.forced = forced;

    this.trigger('panningForced');
  };

  /**
   * @param {number} scale
   */
  EditorViewport.prototype.zoomTo = function(scale)
  {
    var oldScale = this.scale;
    var newScale = Math.round(Math.max(0.01, Math.min(99, scale)) * 100) / 100;

    if (newScale === oldScale)
    {
      return;
    }

    this.scale = newScale;

    this.trigger('zoomed');
  };

  /**
   * @param {number} delta
   */
  EditorViewport.prototype.zoomBy = function(delta)
  {
    this.zoomTo(this.scale + delta);
  };

  EditorViewport.prototype.zoomIn = function()
  {
    var delta = 0.1;

    if (this.scale < 0.15)
    {
      delta = 0.01;
    }
    else if (this.scale < 0.4)
    {
      delta = 0.05;
    }
    else if (this.scale >= 6)
    {
      delta = 1;
    }
    else if (this.scale >= 4)
    {
      delta = 0.5;
    }
    else if (this.scale >= 2)
    {
      delta = 0.2;
    }

    this.zoomBy(delta);
  };

  EditorViewport.prototype.zoomOut = function()
  {
    var delta = 0.1;

    if (this.scale <= 0.15)
    {
      delta = 0.01;
    }
    else if (this.scale <= 0.4)
    {
      delta = 0.05;
    }
    else if (this.scale > 6)
    {
      delta = 1;
    }
    else if (this.scale > 4)
    {
      delta = 0.5;
    }
    else if (this.scale > 2)
    {
      delta = 0.2;
    }

    this.zoomBy(delta * -1);
  };

  /**
   * @param {boolean} [enabled]
   */
  EditorViewport.prototype.toggleGrid = function(enabled)
  {
    if (typeof enabled === 'undefined')
    {
      this.grid.enabled = !this.grid.enabled;
    }
    else
    {
      this.grid.enabled = !!enabled;
    }

    this.trigger('gridToggled');
  };

  /**
   * @returns {string}
   */
  EditorViewport.prototype.getGridBackgroundImage = function()
  {
    var grid = this.grid;

    if (grid.backgroundImage !== null)
    {
      return grid.backgroundImage;
    }

    var width = grid.width * this.scale;
    var height = grid.height * this.scale;

    while (width < grid.minWidth)
    {
      width *= 2;
    }

    while (height < grid.minHeight)
    {
      height *= 2;
    }

    var gridSvg = gridLTemplate({
      steps: grid.steps,
      width: width,
      height: height,
      color: grid.color
    });

    grid.backgroundImage = 'url(data:image/svg+xml;base64,' + btoa(gridSvg.replace(/\n\s*/g, '')) + ') -1px -1px';

    return grid.backgroundImage;
  };

  EditorViewport.prototype.resetGridBackgroundImage = function()
  {
    this.grid.backgroundImage = null;
  };

  /**
   * @param {string} type
   * @returns {string}
   */
  EditorViewport.prototype.getNextClientId = function(type)
  {
    var cidPrefix = type.split('/').pop();
    var cidSuffix = 0;
    var usedCids = {};
    var cidRe = new RegExp('^' + cidPrefix + '([0-9]+)$', 'i');

    this.screen.components.forEach(function(c)
    {
      var matches = (c.get('cid') || '').match(cidRe);

      if (matches)
      {
        usedCids[matches[1]] = true;
      }
    });

    while (usedCids[++cidSuffix]); // eslint-disable-line curly

    return cidPrefix.charAt(0).toLowerCase() + cidPrefix.substring(1) + cidSuffix;
  };

  EditorViewport.prototype.deleteSelection = function()
  {
    var selection = this.selection;
    var components = this.screen.components;

    while (selection.length)
    {
      components.remove(selection.shift());
    }
  };

  return EditorViewport;
});
