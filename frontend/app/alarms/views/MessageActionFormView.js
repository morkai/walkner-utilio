// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'jquery',
  'app/i18n',
  'app/users/UserCollection',
  'app/core/View',
  'app/users/util/setUpUserSelect2',
  'app/alarms/templates/messageActionForm'
], function(
  _,
  $,
  t,
  UserCollection,
  View,
  setUpUserSelect2,
  template
) {
  'use strict';

  return View.extend({

    template: template,

    events: {
      'change #-users': 'updateUsers'
    },

    initialize: function()
    {
      this.userIndex = 0;
      this.fieldNamePrefix = (this.options.kind || 'start') + 'Actions[' + this.options.index + ']';
    },

    serialize: function()
    {
      return {
        idPrefix: this.idPrefix,
        actionType: this.options.actionType,
        fieldNamePrefix: this.fieldNamePrefix
      };
    },

    afterRender: function()
    {
      this.setUpUserSelect2();
    },

    setUpUserSelect2: function()
    {
      var $users = this.$id('users');

      $users.val(_.pluck(this.model && this.model.parameters && this.model.parameters.users || [], 'id').join(','));

      setUpUserSelect2($users, {
        view: this,
        multiple: true,
        onDataLoaded: this.updateUsers.bind(this)
      });
    },

    updateUsers: function()
    {
      this.$('input[name*="users"]').remove();

      _.forEach(this.$id('users').select2('data'), function(user)
      {
        $('<input type="hidden">').attr({
          name: this.fieldNamePrefix + '.parameters.users[' + this.userIndex + '].id',
          value: user.id
        }).appendTo(this.el);

        $('<input type="hidden">').attr({
          name: this.fieldNamePrefix + '.parameters.users[' + this.userIndex + '].label',
          value: user.text
        }).appendTo(this.el);
      }, this);

      ++this.userIndex;

      this.trigger('resize');
    }

  });
});
