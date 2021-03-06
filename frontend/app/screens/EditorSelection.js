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
  function EditorSelection()
  {
    /**
     * @type {typeof ScreenComponent}
     */
    this.model = ScreenComponent;

    /**
     * @type {?ScreenComponent}
     */
    this.lastAdded = null;

    Collection.apply(this, arguments);
  }

  inherits(EditorSelection, Collection);

  return EditorSelection;
});
