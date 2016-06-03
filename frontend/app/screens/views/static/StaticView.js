// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  'app/data/controller',
  'app/core/View',
  'ejs!app/screens/templates/static/pathEnding'
], function(
  _,
  $,
  controller,
  View,
  pathEndingTemplate
) {
  'use strict';

  var userAgent = window.navigator.userAgent;
  var isFirefox = userAgent.indexOf('Firefox/') !== -1;
  var isIeEdge = userAgent.indexOf('Trident/') !== -1 || userAgent.indexOf('Edge/') !== -1;

  /**
   * @constructor
   * @extends {View}
   */
  function StaticView()
  {
    View.apply(this, arguments);

    this.onWindowResize = _.throttle(this.resize.bind(this), 60);
    this.getTagValue = controller.getValue.bind(controller);

    $(window).on('resize.' + this.idPrefix, this.onWindowResize);
  }

  inherits(StaticView, View, {

    /**
     * @type {TagCollection}
     */
    model: null,

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

  StaticView.prototype.destroy = function()
  {
    $(window).off('.' + this.idPrefix, this.onWindowResize);
  };

  StaticView.prototype.serialize = function()
  {
    return {
      idPrefix: this.idPrefix,
      renderPathEnding: pathEndingTemplate
    };
  };

  StaticView.prototype.afterRender = function()
  {
    var view = this;

    this.setUpTags();
    this.setUpFlags();

    this.$('[data-tag]').each(function()
    {
      var tagName = this.getAttribute('data-tag');

      view.updateState(controller.getValue(tagName), tagName);
    });

    this.resize();
  };

  StaticView.prototype.resize = function()
  {
    var height = window.innerHeight - $('.hd').outerHeight(true) - 30;

    this.el.style.height = height + 'px';
  };

  /**
   * @private
   * @param {*} newValue
   * @param {string} tagName
   */
  StaticView.prototype.updateState = function(newValue, tagName)
  {
    /* eslint no-unused-vars:0 */
  };

  /**
   * @private
   * @param {string} tagName
   * @param {*} newValue
   */
  StaticView.prototype.updateRecentTagValue = function(tagName, newValue)
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
      var recent = 0;

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
  StaticView.prototype.setUpTags = function()
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
   */
  StaticView.prototype.setUpFlags = function()
  {
    var flagEls = this.el.getElementsByClassName('el-tag-flag');

    for (var i = 0, l = flagEls.length; i < l; ++i)
    {
      var flagEl = flagEls[i];
      var textEls = flagEl.getElementsByTagName('text');
      var patternIndex = -1;
      var pattern = '';

      for (var ii = 0; ii < textEls.length; ++ii)
      {
        var text = textEls[ii].textContent;

        if (text.length > pattern.length)
        {
          patternIndex = ii;
          pattern = text;
        }
      }

      flagEl.setAttribute('data-pattern', pattern);
      flagEl.setAttribute('data-pattern-index', patternIndex);

      this.adjustTagSize(flagEl);
      this.setTagValue(flagEl.getAttribute('data-tag'), null);
    }
  };

  /**
   * @private
   * @param {HTMLElement} tagEl
   */
  StaticView.prototype.adjustTagSize = function(tagEl)
  {
    var patternIndex = parseInt(tagEl.getAttribute('data-pattern-index'), 10) || 0;
    var rectEl = tagEl.getElementsByTagName('rect')[0];
    var textEl = tagEl.getElementsByTagName('text')[patternIndex];
    var textBBox = textEl.getBBox();
console.log(textEl, textBBox);
    rectEl.setAttribute('width', textBBox.width + (isFirefox ? 3 : 6));
    rectEl.setAttribute('height', textBBox.height + (isIeEdge ? 0 : 3));
  };

  /**
   * @private
   * @param {string} tagName
   * @param {number} value
   */
  StaticView.prototype.setTagValue = function(tagName, value)
  {
    var tagEls = this.el.querySelectorAll('.el-tag[data-tag="' + tagName + '"]');

    for (var i = 0; i < tagEls.length; ++i)
    {
      this.setNumericTagValue(tagEls[i], value);
    }

    var flagEls = this.el.querySelectorAll('.el-tag-flag[data-tag="' + tagName + '"]');

    for (var j = 0; j < flagEls.length; ++j)
    {
      this.setFlagTagValue(flagEls[j], value);
    }
  };

  /**
   * @private
   * @param {SVGElement} tagEl
   * @param {number} value
   */
  StaticView.prototype.setNumericTagValue = function(tagEl, value)
  {
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
   * @param {SVGElement} tagEl
   * @param {number} value
   */
  StaticView.prototype.setFlagTagValue = function(tagEl, value)
  {
console.log('setFlagTagValue', value, tagEl);
    var newState = 'null';

    switch (value)
    {
      case true:
      case 1:
        newState = 'on';
        break;

      case false:
      case 0:
        newState = 'off';
        break;
    }

    var stateEls = tagEl.querySelectorAll('[data-state]');

    for (var i = 0; i < stateEls.length; ++i)
    {
      var stateEl = stateEls[i];

      stateEl.style.display = stateEl.getAttribute('data-state') === newState ? '' : 'none';
    }

    tagEl.setAttribute('data-state', newState);
  };

  /**
   * @private
   * @param {number} value
   * @param {string} pattern
   * @returns {string}
   */
  StaticView.prototype.formatValue = function(value, pattern)
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

  return StaticView;
});
