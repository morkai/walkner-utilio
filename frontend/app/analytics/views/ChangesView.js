// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-hydro project <http://lukasz.walukiewicz.eu/p/walkner-hydro>

define([
  'app/i18n',
  'app/core/views/ListView',
  'app/analytics/templates/changes'
], function(
  t,
  ListView,
  template
) {
  'use strict';

  return ListView.extend({

    template: template,

    remoteTopics: {},

    serialize: function()
    {
      return {
        idPrefix: this.idPrefix,
        groups: this.collection.group(function(tag) { return !!tag.archive; })
      };
    },

    genClientUrl: function(id)
    {
      return '#analytics/changes/' + encodeURIComponent(id);
    }

  });
});
