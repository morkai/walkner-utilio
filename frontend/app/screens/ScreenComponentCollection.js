// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/core/Collection',
  'app/screens/ScreenComponent'
], function(
  Collection,
  ScreenComponent
) {
  'use strict';

  /**
   * @constructor
   * @extends {Collection<ScreenComponent>}
   */
  function ScreenComponentCollection()
  {
    Collection.apply(this, arguments);
  }

  inherits(ScreenComponentCollection, Collection, {

    model: ScreenComponent

  });

  return ScreenComponentCollection;
});
