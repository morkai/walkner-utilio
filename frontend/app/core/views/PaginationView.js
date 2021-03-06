// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'app/core/View',
  'ejs!app/core/templates/pagination'
], function(
  _,
  View,
  paginationTemplate
) {
  'use strict';

  /**
   * @typedef {Object} PaginationViewOptions
   * @property {boolean} [pageNumbers]
   * @property {boolean} [firstLastLinksVisible]
   * @property {boolean} [prevNextLinksVisible]
   * @property {boolean} [dotsVisible]
   * @property {boolean} [replaceUrl]
   */

  /**
   * @private
   * @type {PaginationViewOptions}
   */
  var DEFAULT_OPTIONS = {
    pageNumbers: 3,
    firstLastLinksVisible: true,
    prevNextLinksVisible: true,
    dotsVisible: true,
    replaceUrl: false
  };

  /**
   * @constructor
   * @extends {View}
   * @param {PaginationViewOptions} [options]
   */
  function PaginationView(options)
  {
    View.call(this, options);

    /**
     * @type {PaginationViewOptions}
     */
    this.options = _.defaults(this.options, DEFAULT_OPTIONS);

    this.listenTo(this.model, 'change:urlTemplate', this.render);
  }

  inherits(PaginationView, View, {

    template: paginationTemplate,

    events: {
      'click a': 'onPageClick'
    }

  });

  PaginationView.prototype.afterRender = function()
  {
    var limit = this.model.get('limit');

    if (limit === -1 || (this.model.get('totalCount') <= limit))
    {
      this.$el.hide();
    }
  };

  /**
   * @param {number} newPage
   * @param {string} [href]
   */
  PaginationView.prototype.changePage = function(newPage, href)
  {
    this.model.set({page: newPage});

    if (href)
    {
      this.broker.publish('router.navigate', {
        url: href,
        replace: this.options.replaceUrl
      });
    }
  };

  /**
   * @protected
   * @returns {Object}
   */
  PaginationView.prototype.serialize = function()
  {
    var options = this.options;
    var model = this.model;
    var currentPage = model.get('page');
    var pageCount = Math.ceil(model.get('totalCount') / model.get('limit'));
    var pageNrs = (options.pageNumbers - 1) / 2;

    if (options.dotsVisible)
    {
      pageNrs += 1;
    }

    var firstPageNr = currentPage;
    var lastPageNr = firstPageNr + pageNrs;
    var cut = true;
    var leftDotsVisible = false;

    if ((firstPageNr - pageNrs) < 1)
    {
      firstPageNr = 1;
    }
    else
    {
      firstPageNr -= pageNrs;
      leftDotsVisible = options.dotsVisible && firstPageNr !== 1;
    }

    if (leftDotsVisible)
    {
      firstPageNr += 1;
    }

    if (lastPageNr > pageCount)
    {
      lastPageNr = pageCount;
      cut = false;
    }

    if (currentPage < (pageNrs + 1))
    {
      lastPageNr += (pageNrs + 1) - currentPage;

      if (lastPageNr > pageCount)
      {
        lastPageNr = pageCount;
      }
    }
    else if (currentPage > (pageCount - pageNrs))
    {
      firstPageNr -= pageNrs - (pageCount - currentPage);

      if (firstPageNr < 1)
      {
        firstPageNr = 1;
      }
    }

    var rightDotsVisible = options.dotsVisible
      && cut
      && lastPageNr !== pageCount;

    if (rightDotsVisible)
    {
      lastPageNr -= 1;
    }

    if (firstPageNr === 1)
    {
      leftDotsVisible = false;
    }

    return {
      pageCount: pageCount,
      page: currentPage,
      skip: model.get('skip'),
      limit: model.get('limit'),
      visible: pageCount > 1,
      firstLastLinksVisible: options.firstLastLinksVisible,
      prevNextLinksVisible: options.prevNextLinksVisible,
      leftDotsVisible: leftDotsVisible,
      rightDotsVisible: rightDotsVisible,
      firstPageLinkAvailable: currentPage > 1,
      lastPageLinkAvailable: currentPage < pageCount,
      prevPageLinkAvailable: currentPage > 1,
      nextPageLinkAvailable: currentPage < pageCount,
      firstPageHref: this.genPageHref(1),
      lastPageHref: this.genPageHref(pageCount),
      prevPageHref: this.genPageHref(currentPage - 1),
      nextPageHref: this.genPageHref(currentPage + 1),
      pages: this.genPages(firstPageNr, lastPageNr)
    };
  };

  /**
   * @private
   * @param {number} pageNr
   * @returns {string}
   */
  PaginationView.prototype.genPageHref = function(pageNr)
  {
    var urlTemplate = this.model.get('urlTemplate');
    var limit = this.model.get('limit');

    return urlTemplate
      .replace('${page}', pageNr)
      .replace('${skip}', (pageNr - 1) * limit)
      .replace('${limit}', limit);
  };

  /**
   * @private
   * @param {number} firstPageNr
   * @param {number} lastPageNr
   * @returns {Array<Object>}
   */
  PaginationView.prototype.genPages = function(firstPageNr, lastPageNr)
  {
    var pages = [];
    var currentPage = this.model.get('page');

    for (var page = firstPageNr; page <= lastPageNr; ++page)
    {
      pages.push({
        no: page,
        active: page === currentPage,
        href: this.genPageHref(page)
      });
    }

    return pages;
  };

  /**
   * @private
   * @param {JQueryMouseEventObject} e
   */
  PaginationView.prototype.onPageClick = function(e)
  {
    if (e.button !== 0)
    {
      return;
    }

    e.preventDefault();

    var linkEl = e.currentTarget;

    this.changePage(
      +linkEl.getAttribute('data-page'),
      linkEl.getAttribute('href')
    );
  };

  return PaginationView;
});
