// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  'app/i18n',
  'app/broker',
  'app/socket',
  'app/viewport',
  'app/core/pages/ErrorPage'
],
function(
  _,
  t,
  broker,
  socket,
  viewport,
  ErrorPage
) {
  'use strict';

  var computerName = null;

  if (window.location.search.indexOf('COMPUTERNAME=') !== -1)
  {
    window.location.search.substr(1).split('&').forEach(function(keyValue)
    {
      keyValue = keyValue.split('=');

      if (keyValue[0] === 'COMPUTERNAME' && keyValue[1])
      {
        computerName = keyValue[1];
      }
    });
  }

  var user = {};

  socket.on('user.reload', function(userData)
  {
    user.reload(userData);
  });

  socket.on('user.deleted', function()
  {
    window.location.reload();
  });

  user.data = _.extend(window.GUEST_USER || {}, {
    name: t.bound('core', 'GUEST_USER_NAME')
  });

  delete window.GUEST_USER;

  /**
   * @param {object} userData
   */
  user.reload = function(userData)
  {
    if (_.isEqual(userData, user.data))
    {
      return;
    }

    var wasLoggedIn = user.isLoggedIn();

    if (_.isObject(userData) && Object.keys(userData).length > 0)
    {
      if (userData.loggedIn === false)
      {
        userData.name = t.bound('core', 'GUEST_USER_NAME');
      }

      user.data = userData;
    }

    broker.publish('user.reloaded');

    if (wasLoggedIn && !user.isLoggedIn())
    {
      broker.publish('user.loggedOut');
    }
    else if (!wasLoggedIn && user.isLoggedIn())
    {
      broker.publish('user.loggedIn');
    }
  };

  /**
   * @returns {boolean}
   */
  user.isLoggedIn = function()
  {
    return user.data.loggedIn === true;
  };

  /**
   * @param {boolean} [lastNameFirst]
   * @returns {string}
   */
  user.getLabel = function(lastNameFirst)
  {
    if (user.data.name)
    {
      return String(user.data.name);
    }

    if (user.data.lastName && user.data.firstName)
    {
      if (lastNameFirst)
      {
        return user.data.lastName + ' ' + user.data.firstName;
      }

      return user.data.firstName + ' ' + user.data.lastName;
    }

    return user.data.login;
  };

  /**
   * @returns {{id: string, label: string, ip: string, cname: string}}
   */
  user.getInfo = function()
  {
    return {
      id: user.data._id,
      ip: user.data.ip || user.data.ipAddress || '0.0.0.0',
      cname: computerName,
      label: user.getLabel()
    };
  };

  user.isAllowedTo = function(privilege)
  {
    if (user.data.super)
    {
      return true;
    }

    var userPrivileges = user.data.privileges;
    var anyPrivileges = (arguments.length === 1 ? [privilege] : Array.prototype.slice.call(arguments)).map(function(p)
    {
      return Array.isArray(p) ? p : [p];
    });

    if (anyPrivileges.length
      && user.data.local
      && anyPrivileges[0].some(function(privilege) { return privilege === 'LOCAL'; }))
    {
      return true;
    }

    if (!userPrivileges)
    {
      return false;
    }

    if (!anyPrivileges.length)
    {
      return user.isLoggedIn();
    }

    for (var i = 0, l = anyPrivileges.length; i < l; ++i)
    {
      var allPrivileges = anyPrivileges[i];
      var actualMatches = 0;
      var requiredMatches = allPrivileges.length;

      for (var ii = 0; ii < requiredMatches; ++ii)
      {
        var requiredPrivilege = allPrivileges[ii];

        if (/^FN:/.test(requiredPrivilege))
        {
          actualMatches += user.data.prodFunction === requiredPrivilege.substring(3) ? 1 : 0;
        }
        else
        {
          actualMatches += user.hasPrivilege(allPrivileges[ii]) ? 1 : 0;
        }
      }

      if (actualMatches === requiredMatches)
      {
        return true;
      }
    }

    return false;
  };

  user.auth = function()
  {
    var anyPrivileges = Array.prototype.slice.call(arguments);

    return function(req, referer, next)
    {
      if (user.isAllowedTo.apply(user, anyPrivileges))
      {
        next();
      }
      else if (!user.isLoggedIn())
      {
        broker.publish('router.navigate', {
          url: '/login',
          trigger: true,
          replace: true
        });
      }
      else
      {
        viewport.showPage(new ErrorPage({code: 401, req: req, referer: referer}));
      }
    };
  };

  user.hasPrivilege = function(privilege)
  {
    if (!user.data.privilegesMap)
    {
      if (!Array.isArray(user.data.privileges))
      {
        user.data.privileges = [];
      }

      user.data.privilegesString = '|' + user.data.privileges.join('|');
      user.data.privilegesMap = {};

      _.forEach(user.data.privileges, function(privilege) { user.data.privilegesMap[privilege] = true; });
    }

    if (privilege.charAt(privilege.length - 1) === '*')
    {
      return user.data.privilegesString.indexOf('|' + privilege.substr(0, privilege.length - 1)) !== -1;
    }

    return user.data.privilegesMap[privilege] === true;
  };

  user.getGuestUserData = function()
  {
    return window.GUEST_USER || {
      _id: null,
      login: 'guest',
      name: t.bound('core', 'GUEST_USER_NAME'),
      loggedIn: false,
      super: false,
      privileges: []
    };
  };

  user.getRootUserData = function()
  {
    return window.ROOT_USER || {
      _id: null,
      login: 'root',
      name: 'root',
      loggedIn: true,
      super: true,
      privileges: []
    };
  };

  window.user = user;

  return user;
});
