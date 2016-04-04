// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define({
  load: function(name, req, onload, config)
  {
    'use strict';

    req([name], function(value)
    {
      onload(value);
    });
  }
});
