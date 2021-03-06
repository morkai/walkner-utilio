// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'jquery',
  'backbone',
  'bootstrap',
  'select2',
  'app/core/util'
],
function(
  $,
  Backbone,
  Bootstrap,
  Select2,
  util
) {
  'use strict';

  var originalSync = Backbone.sync;

  Backbone.sync = function(method, model, options)
  {
    options.syncMethod = method;

    return originalSync.call(this, method, model, options);
  };

  $.fn.modal.Constructor.prototype.enforceFocus = function() {};

  $.fn.modal.Constructor.prototype.escape = function()
  {
    if (this.isShown && this.options.keyboard)
    {
      this.$element.on(
        'keydown.dismiss.bs.modal',
        $.proxy(function(e)
        {
          if (e.which === 27)
          {
            this.hide();
          }
        }, this)
      );
    }
    else if (!this.isShown)
    {
      this.$element.off('keydown.dismiss.bs.modal');
    }
  };

  var $body = $(document.body);

  $.fn.select2.defaults.dropdownContainer = function(select2)
  {
    var $modalBody = select2.container.closest('.modal-body');

    if ($modalBody.length === 0)
    {
      return $body;
    }

    var $modalDialog = $modalBody.closest('.modal-dialog');

    return $modalDialog.length === 0 ? $body : $modalDialog;
  };

  $body.on('click', 'label[for]', function(e)
  {
    var $el = $('#' + e.target.htmlFor);

    if ($el.data('select2') && !$el.parent().hasClass('has-required-select2'))
    {
      $el.select2('focus');
    }
  });

  return {};
});
