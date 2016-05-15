// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'require',
  'underscore',
  'jquery',
  'app/core/View',
  'app/core/views/MessagesView',
  'ejs!app/core/templates/dialogContainer'
], function(
  require,
  _,
  $,
  View,
  MessagesView,
  dialogContainerTemplate
) {
  'use strict';

  var DEFAULT_PAGE_FACTORY = function(Page)
  {
    return new Page();
  };

  /**
   * @constructor
   * @extends {View}
   * @param {Object} options
   */
  function Viewport(options)
  {
    View.call(this, options);

    /**
     * @type {MessagesView}
     */
    this.msg = options.messagesView ? options.messagesView : new MessagesView({el: this.el});

    /**
     * @type {HTMLDocument}
     */
    this.document = options.document || window.document;

    /**
     * @type {Object<string, typeof Backbone.Layout>}
     */
    this.layouts = {};

    /**
     * @type {?Backbone.Layout}
     */
    this.currentLayout = null;

    /**
     * @type {?string}
     */
    this.currentLayoutName = null;

    /**
     * @type {?Backbone.View}
     */
    this.currentPage = null;

    /**
     * @type {?jQuery}
     */
    this.$dialog = null;

    /**
     * @type {Array<Backbone.View>}
     */
    this.dialogQueue = [];

    /**
     * @type {?Backbone.View}
     */
    this.currentDialog = null;

    /**
     * @type {number}
     */
    this.pageCounter = 0;

    this.closeDialog = this.closeDialog.bind(this);

    this.$el.on('click', '.viewport-dialog .cancel', this.closeDialog);
  }

  inherits(Viewport, View);

  Viewport.prototype.cleanup = function()
  {
    this.broker.destroy();
    this.msg.remove();
    this.$dialog.remove();

    if (this.currentPage)
    {
      this.currentPage.remove();
    }

    if (this.currentLayout)
    {
      this.currentLayout.remove();
    }

    if (this.currentDialog)
    {
      this.currentDialog.remove();
    }

    _.invoke(this.dialogQueue.filter(_.isObject), 'remove');

    this.$el.off('click', '.viewport-dialog .cancel', this.closeDialog);

    this.broker = null;
    this.msg = null;
    this.$dialog = null;
    this.currentLayout = null;
    this.currentDialog = null;
    this.dialogQueue = null;
    this.layouts = null;
  };

  Viewport.prototype.afterRender = function()
  {
    if (this.$dialog !== null)
    {
      return this.closeDialog();
    }

    this.$dialog = $(dialogContainerTemplate()).appendTo(this.el).modal({
      show: false,
      backdrop: true
    });
    this.$dialog.on('shown.bs.modal', this.onDialogShown.bind(this));
    this.$dialog.on('hidden.bs.modal', this.onDialogHidden.bind(this));
  };

  /**
   * @param {string} name
   * @param {function(): Backbone.Layout} layoutFactory
   * @returns {Viewport}
   */
  Viewport.prototype.registerLayout = function(name, layoutFactory)
  {
    this.layouts[name] = layoutFactory;

    return this;
  };

  /**
   * @param {Array<string>} dependencies
   * @param {function(...*): Backbone.View} createPage
   */
  Viewport.prototype.loadPage = function(dependencies, createPage)
  {
    this.msg.loading();

    if (!_.isFunction(createPage))
    {
      createPage = DEFAULT_PAGE_FACTORY;
    }

    var viewport = this;
    var pageCounter = ++this.pageCounter;

    require([].concat(dependencies), function()
    {
      if (pageCounter === viewport.pageCounter)
      {
        viewport.showPage(createPage.apply(null, arguments));
      }

      viewport.msg.loaded();
    });
  };

  /**
   * @param {Backbone.View} page
   */
  Viewport.prototype.showPage = function(page)
  {
    var layoutName = _.result(page, 'layoutName');

    if (!_.isObject(this.layouts[layoutName]))
    {
      throw new Error('Unknown layout: `' + layoutName + '`');
    }

    ++this.pageCounter;

    var viewport = this;

    this.broker.publish('viewport.page.loading', page);

    if (_.isFunction(page.load))
    {
      page.load(when).then(onPageLoadSuccess, onPageLoadFailure);
    }
    else
    {
      onPageLoadSuccess();
    }

    function when()
    {
      var requests = [];

      for (var i = 0; i < arguments.length; ++i)
      {
        var request = arguments[i];

        if (Array.isArray(request))
        {
          requests.push.apply(requests, request);
        }
        else
        {
          requests.push(request);
        }
      }

      return $.when.apply($, _.map(requests, page.promised, page));
    }

    function onPageLoadSuccess()
    {
      viewport.broker.publish('viewport.page.loaded', page);

      if (viewport.currentPage !== null)
      {
        viewport.currentPage.remove();
      }

      viewport.currentPage = page;
      window.page = page;

      var layout = viewport.setLayout(layoutName);

      if (_.isFunction(layout.setUpPage))
      {
        layout.setUpPage(page);
      }

      if (_.isFunction(page.setUpLayout))
      {
        page.setUpLayout(layout);
      }

      if (_.isObject(page.view))
      {
        page.setView(page.view);
      }

      layout.setView(layout.pageContainerSelector, page);

      if (!viewport.isRendered())
      {
        viewport.render();
      }
      else if (!layout.isRendered())
      {
        layout.render();
      }
      else
      {
        page.render();
      }

      viewport.broker.publish('viewport.page.shown', page);
    }

    function onPageLoadFailure()
    {
      viewport.broker.publish('viewport.page.loadingFailed', page);

      page.remove();

      console.log('onPageLoadFailure');
    }
  };

  /**
   * @param {Backbone.View} dialogView
   * @param {(string|{toString: function(): string})} [title]
   * @returns {Viewport}
   */
  Viewport.prototype.showDialog = function(dialogView, title)
  {
    if (this.currentDialog !== null)
    {
      this.dialogQueue.push(dialogView, title);

      return this;
    }

    var afterRender = dialogView.afterRender;
    var viewport = this;

    dialogView.afterRender = function()
    {
      var $modalBody = viewport.$dialog.find('.modal-body');

      if ($modalBody.children()[0] !== dialogView.el)
      {
        $modalBody.empty().append(dialogView.el);
      }

      viewport.$dialog.modal('show');

      if (_.isFunction(afterRender))
      {
        afterRender.apply(dialogView, arguments);
      }
    };

    this.currentDialog = dialogView;

    var $header = this.$dialog.find('.modal-header');

    if (title)
    {
      $header.find('.modal-title').text(title);
      $header.show();
    }
    else
    {
      $header.hide();
    }

    if (dialogView.dialogClassName)
    {
      this.$dialog.addClass(_.result(dialogView, 'dialogClassName'));
    }

    dialogView.render();

    return this;
  };

  /**
   * @param {{preventDefault: function}} [e]
   * @returns {Viewport}
   */
  Viewport.prototype.closeDialog = function(e)
  {
    if (this.currentDialog === null)
    {
      return this;
    }

    this.$dialog.modal('hide');

    if (e && e.preventDefault)
    {
      e.preventDefault();
    }

    return this;
  };

  Viewport.prototype.closeAllDialogs = function()
  {
    this.dialogQueue = [];

    this.closeDialog();
  };

  /**
   * @private
   * @param {string} layoutName
   * @returns {Backbone.Layout}
   */
  Viewport.prototype.setLayout = function(layoutName)
  {
    if (layoutName === this.currentLayoutName)
    {
      if (_.isFunction(this.currentLayout.reset))
      {
        this.currentLayout.reset();
      }

      return this.currentLayout;
    }

    var createNewLayout = this.layouts[layoutName];
    var selector = this.options.selector || '';

    if (_.isObject(this.currentLayout))
    {
      this.removeView(selector);
    }

    this.currentLayoutName = layoutName;
    this.currentLayout = createNewLayout();

    this.setView(selector, this.currentLayout);

    return this.currentLayout;
  };

  /**
   * @private
   */
  Viewport.prototype.onDialogShown = function()
  {
    if (!this.currentDialog)
    {
      return;
    }

    this.currentDialog.$('[autofocus]').focus();

    if (_.isFunction(this.currentDialog.onDialogShown))
    {
      this.currentDialog.onDialogShown(this);
    }

    this.broker.publish('viewport.dialog.shown', this.currentDialog);
  };

  /**
   * @private
   */
  Viewport.prototype.onDialogHidden = function()
  {
    if (!this.currentDialog)
    {
      return;
    }

    if (this.currentDialog.dialogClassName)
    {
      this.$dialog.removeClass(_.result(this.currentDialog, 'dialogClassName'));
    }

    if (_.isFunction(this.currentDialog.remove))
    {
      this.currentDialog.remove();

      this.broker.publish('viewport.dialog.hidden', this.currentDialog);
    }

    this.currentDialog = null;

    if (this.dialogQueue.length)
    {
      this.showDialog(this.dialogQueue.shift(), this.dialogQueue.shift());
    }
  };

  return Viewport;
});
