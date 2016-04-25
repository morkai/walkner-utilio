// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  '../core/Collection',
  './Tag',
  'i18n!app/nls/tags'
], function(
  _,
  Collection,
  Tag
) {
  'use strict';

  return Collection.extend({

    model: Tag,

    rqlQuery: 'sort(+name)',

    group: function(filter)
    {
      var result = {other: {tags: [], groups: {}}};
      var tags = this.toJSON();

      tags.sort(function(a, b) { return a.name.localeCompare(b.name); });

      for (var i = 0, l = tags.length; i < l; ++i)
      {
        var currentTag = tags[i];

        if (filter && !filter(currentTag))
        {
          continue;
        }

        var nextTag = tags[i + 1];
        var nameParts = currentTag.name.split('.');
        var group = nameParts[0];
        var subgroup = null;

        if (nameParts.length === 1)
        {
          if (!nextTag || nextTag.name.indexOf(nameParts[0] + '.') !== 0)
          {
            group = 'other';
          }
        }
        else if (/^[0-9]+$/.test(nameParts[1]))
        {
          subgroup = nameParts[1];
        }

        if (!result[group])
        {
          result[group] = {tags: [], groups: {}};
        }

        if (subgroup === null)
        {
          result[group].tags.push(currentTag);
        }
        else
        {
          if (!result[group].groups[subgroup])
          {
            result[group].groups[subgroup] = [];
          }

          result[group].groups[subgroup].push(currentTag);
        }
      }

      _.forEach(result, function(group, key)
      {
        if (_.isEmpty(group.tags) && _.isEmpty(group.groups))
        {
          delete result[key];
        }
      });

      return result;
    },

    getValue: function(tagName)
    {
      var tag = this.get(tagName);

      return tag ? tag.get('value') : null;
    }

  });
});
