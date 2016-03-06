// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  'app/i18n',
  'app/core/views/FormView',
  './MessageActionFormView',
  './SeverityActionFormView',
  'app/alarms/templates/form',
  'app/alarms/templates/actionControls'
], function(
  _,
  $,
  t,
  FormView,
  MessageActionFormView,
  SeverityActionFormView,
  formTemplate,
  actionControlsTemplate
) {
  'use strict';

  var SEVERITY_TO_BTN_CLASS = {
    debug: 'btn-default',
    info: 'btn-info',
    success: 'btn-success',
    warning: 'btn-warning',
    error: 'btn-danger'
  };

  return FormView.extend({

    template: formTemplate,

    events: _.extend({}, FormView.prototype.events, {
      'change input[name="stopConditionMode"]': function()
      {
        this.toggleStopConditionState();
      },
      'click .alarms-form-actions-add': function()
      {
        this.addAction(this.$id('actions-type').val());
      },
      'click .alarms-form-action-controls-remove': function(e)
      {
        this.removeAction(this.$(e.target).closest('.alarms-form-action'));
      },
      'click .alarms-form-action-controls-up': function(e)
      {
        this.moveActionUp(this.$(e.target).closest('.alarms-form-action'));
      },
      'click .alarms-form-action-controls-down': function(e)
      {
        this.moveActionDown(this.$(e.target).closest('.alarms-form-action'));
      },
      'click .severity': function(e)
      {
        var $target = this.$(e.target);

        this.changeActionSeverity(
          $target.closest('.alarms-form-action'),
          $target.closest('.severity').attr('data-severity'),
          true
        );

        return false;
      }
    }),

    initialize: function()
    {
      FormView.prototype.initialize.apply(this, arguments);

      this.lastActionIndex = 0;
      this.scheduleResizeArrow = _.debounce(this.resizeArrow.bind(this), 100);

      $(window).on('resize.alarms', this.scheduleResizeArrow);
    },

    destroy: function()
    {
      $(window).off('.alarms');
    },

    afterRender: function()
    {
      var startActions = this.model.get('startActions');

      for (var i = 0; i < startActions.length; ++i)
      {
        this.addAction(startActions[i].type, startActions[i]);
      }

      FormView.prototype.afterRender.call(this);

      this.toggleStopConditionState();
      this.checkActionsValidity();
      this.resizeArrow();
    },

    toggleStopConditionState: function()
    {
      this.$id('stopCondition').attr(
        'disabled',
        this.$('input[name="stopConditionMode"]:checked').val() !== 'specified'
      );
    },

    checkActionsValidity: function()
    {
      this.$id('actions-type')[0].setCustomValidity(
        this.$('.alarms-form-action').length ? '' : t('alarms', 'FORM:ERROR:noActions')
      );
    },

    addAction: function(actionType, actionModel)
    {
      var actionView = null;
      var actionIndex = ++this.lastActionIndex;

      switch (actionType)
      {
        case 'sms':
        case 'email':
          actionView = new MessageActionFormView({
            actionType: actionType,
            extraUserProperty: actionType === 'sms' ? 'mobile' : 'email',
            index: actionIndex,
            model: actionModel
          });
          break;

        case 'severity':
          actionView = new SeverityActionFormView({
            index: actionIndex
          });
          break;

        default:
          return;
      }

      this.insertView('.alarms-form-actions', actionView);

      actionView.render();
      actionView.$el.append(actionControlsTemplate());
      actionView.$el.find('.alarms-form-action-controls-severity').dropdown();

      this.changeActionSeverity(actionView.$el, actionModel ? actionModel.severity : 'warning');

      var resizeArrow = this.resizeArrow.bind(this);

      function resize()
      {
        actionView.on('resize', resizeArrow);
        resizeArrow();
      }

      if (actionModel)
      {
        resize();
      }
      else
      {
        resizeArrow();
        actionView.$el.hide().fadeIn(resize);
      }

      this.checkActionsValidity();
    },

    resizeArrow: function()
    {
      var $arrow = this.$('.alarms-form-actions-arrow');
      var $actions = this.$('.alarms-form-actions');

      $arrow.height($actions.outerHeight(true) + 20);

      this.$('.alarms-form-actions-control-group').toggleClass(
        'alarms-form-actions-empty',
        $actions.children().length === 0
      );
    },

    changeActionSeverity: function($action, newSeverity, hide)
    {
      var $severityValue = $action.find('.alarms-form-action-severity');
      var oldSeverity = $severityValue.val();
      var $severityControl = $action.find('.alarms-form-action-controls-severity');

      $severityControl.removeClass(SEVERITY_TO_BTN_CLASS[oldSeverity]);
      $severityControl.addClass(SEVERITY_TO_BTN_CLASS[newSeverity]);

      if (hide)
      {
        $severityControl.dropdown('toggle');
      }

      $severityValue.val(newSeverity);
    },

    removeAction: function($action)
    {
      var alarmFormView = this;
      var actionView = this.getViews({el: $action[0]}).first().value();

      $action.find('.alarms-form-action-controls-remove').attr('disabled', true);
      $action.fadeOut(function()
      {
        actionView.remove();
        alarmFormView.resizeArrow();
        alarmFormView.checkActionsValidity();
      });
    },

    moveActionUp: function($action)
    {
      var $actions = this.$('.alarms-form-action');

      if ($actions.length === 1)
      {
        return;
      }

      var alarmFormView = this;
      var $control = $action.find('.alarms-form-action-controls-up');

      $control.attr('disabled', true);
      $action.fadeOut('fast', function()
      {
        var $prevAction = $action.prev();

        if ($prevAction.length === 0)
        {
          $action.insertAfter($actions.last());
        }
        else
        {
          $action.insertBefore($prevAction);
        }

        $control.attr('disabled', false);
        $action.fadeIn('fast', alarmFormView.resizeArrow.bind(alarmFormView));
      });
    },

    moveActionDown: function($action)
    {
      var $actions = this.$('.alarms-form-action');

      if ($actions.length === 1)
      {
        return;
      }

      var alarmFormView = this;
      var $control = $action.find('.alarms-form-action-controls-up');

      $control.attr('disabled', true);
      $action.fadeOut('fast', function()
      {
        var $nextAction = $action.next();

        if ($nextAction.length === 0)
        {
          $action.insertBefore($actions.first());
        }
        else
        {
          $action.insertAfter($nextAction);
        }

        $control.attr('disabled', false);
        $action.fadeIn('fast', alarmFormView.resizeArrow.bind(alarmFormView));
      });
    },

    handleFailure: function(xhr)
    {
      var error = xhr.responseJSON.error || {};

      if (t.has('alarms', 'FORM:ERROR:' + error.code))
      {
        this.showErrorMessage(t('alarms', 'FORM:ERROR:' + error.code, error));
      }
      else
      {
        FormView.prototype.handleFailure.apply(this, arguments)
      }
    }

  });
});
