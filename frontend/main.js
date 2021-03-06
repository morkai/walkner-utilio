// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

(function()
{
  'use strict';

  var location = window.location;

  if (!location.origin)
  {
    location.origin = location.protocol + '//' + location.hostname + (location.port ? (':' + location.port) : '');
  }

  if (window.ENV === 'testing')
  {
    var matches = location.hash.match(/^(?:#proxy=([0-9]+))?(#.*?)?$/);

    if (!matches || matches[1] == null || matches[1] === localStorage.getItem('PROXY'))
    {
      location.href = '/redirect?referrer=' + encodeURIComponent(
        location.origin + '/#proxy=' + Date.now() + (matches && matches[2] ? matches[2] : '#')
      );

      return;
    }

    window.location.hash = matches && matches[2] ? matches[2] : '#';

    localStorage.setItem('PROXY', matches[1]);
  }

  var domains = [];
  var i18n = null;
  var select2 = null;

  require.onError = function(err)
  {
    console.error(err);

    var loadingEl = document.getElementById('app-loading');

    if (!loadingEl)
    {
      return;
    }

    loadingEl.className = 'error';

    var spinnerEl = loadingEl.getElementsByClassName('fa-spin')[0];

    if (spinnerEl)
    {
      spinnerEl.classList.remove('fa-spin');
    }
  };

  require.onResourceLoad = function(context, map)
  {
    if (map.prefix === 'i18n')
    {
      var keys = context.defined[map.id];
      var domain = map.id.substr(map.id.lastIndexOf('/') + 1);

      if (i18n !== null)
      {
        i18n.register(domain, keys, map.id);
      }
      else
      {
        domains.push([domain, keys, map.id]);
      }
    }
    else if (map.id === 'app/i18n')
    {
      i18n = context.defined[map.id];
      i18n.config = context.config.config.i18n;

      domains.forEach(function(domainData)
      {
        i18n.register(domainData[0], domainData[1], domainData[2]);
      });

      domains = null;
    }
    else if (map.id === 'select2')
    {
      select2 = context.defined[map.id];
      select2.lang = function(lang)
      {
        window.jQuery.extend(window.jQuery.fn.select2.defaults, select2.lang[lang]);
      };
    }
    else if (/^select2-lang/.test(map.id))
    {
      var lang = map.id.substr(map.id.lastIndexOf('/') + 1);

      select2.lang[lang] = context.defined[map.id];
    }
  };

  /**
   * @param {function} ctor
   * @param {function} superCtor
   * @param {Object} [proto]
   * @returns {function}
   */
  window.inherits = function(ctor, superCtor, proto)
  {
    function Surrogate()
    {
      this.constructor = ctor;
    }

    Surrogate.prototype = superCtor.prototype;
    ctor.prototype = new Surrogate();
    ctor.__super__ = superCtor.prototype; // eslint-disable-line no-underscore-dangle

    var keys;
    var key;
    var i;

    keys = Object.keys(superCtor);

    for (i = 0; i < keys.length; ++i)
    {
      key = keys[i];
      ctor[key] = superCtor[key];
    }

    if (proto)
    {
      keys = Object.keys(proto);

      for (i = 0; i < keys.length; ++i)
      {
        key = keys[i];
        ctor.prototype[key] = proto[key];
      }
    }

    return ctor;
  };

  var appCache = window.applicationCache;

  if (!appCache || !navigator.onLine || !document.getElementsByTagName('html')[0].hasAttribute('manifest'))
  {
    window.requireApp();

    return;
  }

  var reload = location.reload.bind(location);
  var reloadTimer = setTimeout(reload, 60000);

  function doStartApp()
  {
    clearTimeout(reloadTimer);
    reloadTimer = null;

    appCache.onnoupdate = null;
    appCache.oncached = null;
    appCache.onerror = null;
    appCache.onobsolete = null;
    appCache.onupdateready = null;

    window.requireApp();
  }

  appCache.onnoupdate = doStartApp;
  appCache.oncached = doStartApp;
  appCache.onerror = doStartApp;
  appCache.onobsolete = reload;
  appCache.onupdateready = reload;
})();
