// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  'app/data/controller',
  'app/core/View',
  'ejs!app/screens/templates/static/b6',
  'ejs!app/screens/templates/static/pathEnding'
], function(
  _,
  $,
  controller,
  View,
  screenTemplate,
  pathEndingTemplate
) {
  'use strict';

  /**
   * @constructor
   * @extends {View}
   */
  function B6View()
  {
    View.apply(this, arguments);

    this.onWindowResize = _.throttle(this.resize.bind(this), 60);
    this.getTagValue = controller.getValue.bind(controller);

    $(window).on('resize.' + this.idPrefix, this.onWindowResize);
  }

  inherits(B6View, View, {

    /**
     * @type {TagCollection}
     */
    model: null,

    template: screenTemplate,

    bindThis: [],

    localTopics: {
      'controller.valuesChanged': function(changes)
      {
        _.forEach(changes, this.updateState, this);
      }
    },

    events: {
      'click .el-tag.el-clickable': function(e)
      {
        var tag = controller.get(e.currentTarget.getAttribute('data-tag'));

        if (!tag)
        {
          return;
        }

        window.location.href = tag.get('archive') === 'avg'
          ? ('#analytics/charts?tag=' + tag.id)
          : ('#analytics/changes/' + tag.id);
      }
    }

  });

  B6View.prototype.destroy = function()
  {
    $(window).off('.' + this.idPrefix, this.onWindowResize);
  };

  B6View.prototype.serialize = function()
  {
    return {
      idPrefix: this.idPrefix,
      renderPathEnding: pathEndingTemplate
    };
  };

  B6View.prototype.afterRender = function()
  {
    var view = this;

    this.setUpTags();

    this.$('[data-tag]').each(function()
    {
      var tagName = this.getAttribute('data-tag');

      view.updateState(controller.getValue(tagName), tagName);
    });

    this.resize();
  };

  B6View.prototype.resize = function()
  {
    var height = window.innerHeight - $('.hd').outerHeight(true) - 30;

    this.el.style.height = height + 'px';
  };

  /**
   * @private
   * @param {*} newValue
   * @param {string} tagName
   */
  B6View.prototype.updateState = function(newValue, tagName)
  {
    switch (tagName)
    {
      case 'em.5.sum':
        this.setTagValue(tagName, newValue);
        this.updateRecentTagValue(tagName, newValue);
        break;
    }
  };

  /**
   * @private
   * @param {string} tagName
   * @param {*} newValue
   */
  B6View.prototype.updateRecentTagValue = function(tagName, newValue)
  {
    if (newValue == null)
    {
      return;
    }

    var view = this;
    var req = view.ajax({
      url: '/tags/' + tagName + '/changes?t>=' + (Date.now() - 15 * 60 * 1000)
    });
    var recentTagName = tagName + '.recent';

    req.fail(function()
    {
      view.setTagValue(recentTagName, null);
    });

    req.done(function(res)
    {
      if (res.collection.length < 2)
      {
        return view.setTagValue(recentTagName, null);
      }

      var latest = res.collection[0].x;
      var recent = null;

      for (var i = 1; i < res.collection.length; ++i)
      {
        var value = res.collection[i].x;

        if (value !== latest)
        {
          recent = latest - value;

          break;
        }
      }

      view.setTagValue(recentTagName, recent);
    });
  };

  /**
   * @private
   */
  B6View.prototype.setUpTags = function()
  {
    var tagEls = this.el.getElementsByClassName('el-tag');

    for (var i = 0, l = tagEls.length; i < l; ++i)
    {
      var tagEl = tagEls[i];
      var pattern = tagEl.getElementsByTagName('text')[0].textContent;

      tagEl.setAttribute('data-pattern', pattern);

      this.setTagValue(tagEl.getAttribute('data-tag'), null);
      this.adjustTagSize(tagEl);
    }
  };

  /**
   * @private
   * @param {HTMLElement} tagEl
   */
  B6View.prototype.adjustTagSize = function(tagEl)
  {
    var rectEl = tagEl.getElementsByTagName('rect')[0];
    var textEl = tagEl.getElementsByTagName('text')[0];
    var textBBox = textEl.getBBox();

    rectEl.setAttribute('width', textBBox.width + 6);
    rectEl.setAttribute('height', textBBox.height + 3);
  };

  /**
   * @private
   * @param {string} tagName
   * @param {number} value
   */
  B6View.prototype.setTagValue = function(tagName, value)
  {
    var tagEl = this.el.querySelector('.el-tag[data-tag="' + tagName + '"]');

    if (!tagEl)
    {
      return;
    }

    var pattern = tagEl.getAttribute('data-pattern');

    if (!pattern)
    {
      return;
    }

    var textEl = tagEl.getElementsByTagName('text')[0];

    if (!textEl)
    {
      return;
    }

    var oldValue = textEl.textContent.trim();
    var newValue = this.formatValue(value, pattern);

    textEl.textContent = newValue;

    if (newValue.length !== oldValue.length)
    {
      this.adjustTagSize(tagEl);
    }
  };

  /**
   * @private
   * @param {number} value
   * @param {string} pattern
   * @returns {string}
   */
  B6View.prototype.formatValue = function(value, pattern)
  {
    pattern = pattern.split(' ');

    var numParts = pattern[0].split('.');
    var decimals = 0;

    if (numParts.length === 2)
    {
      decimals = numParts[1].length;
    }

    var padValue;

    if (typeof value === 'number')
    {
      value = value.toFixed(decimals);
      padValue = '\u00A0';
    }
    else
    {
      value = '?';
      padValue = '?';
    }

    while (value.length < pattern[0].length)
    {
      value = padValue + value;
    }

    return value + (pattern.length === 2 ? (' ' + pattern[1]) : '');
  };

  return B6View;
});
