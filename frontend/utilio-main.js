// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

(function()
{
  'use strict';

  window.requireApp = requireApp;

  function requireApp()
  {
    require([
      'domReady',
      'jquery',
      'backbone',
      'backbone.layout',
      'moment',
      'app/monkeyPatch',
      'app/broker',
      'app/i18n',
      'app/socket',
      'app/router',
      'app/viewport',
      'app/updater/index',
      'app/data/loadedModules',
      'app/core/layouts/PageLayout',
      'app/core/layouts/BlankLayout',
      'app/core/views/NavbarView',
      'app/core/views/LogInFormView',
      'app/time',
      'app/utilio-routes',
      'bootstrap',
      'moment-lang/' + window.appLocale,
      'select2-lang/' + window.appLocale,
      'i18n!app/nls/core'
    ], startApp);
  }

  function startApp(
    domReady,
    $,
    Backbone,
    Layout,
    moment,
    monkeyPatch,
    broker,
    i18n,
    socket,
    router,
    viewport,
    updater,
    loadedModules,
    PageLayout,
    BlankLayout,
    NavbarView,
    LogInFormView)
  {
    var startBroker = null;

    socket.connect();

    moment.locale(window.appLocale);

    $.ajaxSetup({
      dataType: 'json',
      accepts: {
        json: 'application/json',
        text: 'text/plain'
      },
      contentType: 'application/json'
    });

    Layout.configure({
      manage: true,
      el: false,
      keep: true
    });

    viewport.registerLayout('page', function createPageLayout()
    {
      return new PageLayout({
        views: {
          '.navbar': createNavbarView()
        },
        version: updater.getCurrentVersionString(),
        changelogUrl: '#changelog'
      });
    });

    viewport.registerLayout('blank', function createBlankLayout()
    {
      return new BlankLayout();
    });

    if (navigator.onLine)
    {
      startBroker = broker.sandbox();

      startBroker.subscribe('socket.connected', function()
      {
        startBroker.subscribe('user.reloaded', doStartApp);
      });

      startBroker.subscribe('socket.connectFailed', doStartApp);

      broker.subscribe('page.titleChanged', function(newTitle)
      {
        newTitle.unshift(i18n('core', 'TITLE'));

        document.title = newTitle.reverse().join(' < ');
      });
    }
    else
    {
      doStartApp();
    }

    function createNavbarView()
    {
      var req = router.getCurrentRequest();
      var navbarView = new NavbarView({
        currentPath: req === null ? '/' : req.path,
        loadedModules: loadedModules.map
      });

      navbarView.on('logIn', function()
      {
        viewport.showDialog(
          new LogInFormView(), i18n('core', 'LOG_IN_FORM:TITLE:LOG_IN')
        );
      });

      navbarView.on('logOut', function()
      {
        $.ajax({
          type: 'GET',
          url: '/logout'
        }).fail(function()
        {
          viewport.msg.show({
            type: 'error',
            text: i18n('core', 'MSG:LOG_OUT:FAILURE'),
            time: 5000
          });
        });
      });

      return navbarView;
    }

    function doStartApp()
    {
      if (startBroker !== null)
      {
        startBroker.destroy();
        startBroker = null;
      }

      broker.subscribe('i18n.reloaded', function(message)
      {
        localStorage.setItem('LOCALE', message.newLocale);
        viewport.render();
      });

      broker.subscribe('user.reloaded', function()
      {
        var currentRequest = router.getCurrentRequest();

        viewport.render();

        if (!/^\/production\//.test(currentRequest.path))
        {
          router.dispatch(currentRequest.url);
        }
      });

      broker.subscribe('user.loggedIn', function()
      {
        var req = router.getCurrentRequest();

        if (!req)
        {
          return;
        }

        var url = req.url;

        if (url === '/' || url === '/login')
        {
          router.replace(window.DASHBOARD_URL_AFTER_LOG_IN || '/');
        }
      });

      broker.subscribe('user.loggedOut', function()
      {
        viewport.msg.show({
          type: 'success',
          text: i18n('core', 'MSG:LOG_OUT:SUCCESS'),
          time: 2500
        });

        broker.publish('router.navigate', {
          url: '/',
          trigger: true
        });
      });

      domReady(function()
      {
        $('#app-loading').fadeOut(function() { $(this).remove(); });

        if (window.ENV)
        {
          document.body.classList.add('is-' + window.ENV + '-env');
        }

        Backbone.history.start({
          root: '/',
          hashChange: true,
          pushState: false
        });
      });
    }
  }
})();
