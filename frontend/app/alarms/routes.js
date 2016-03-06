// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'underscore',
  '../user',
  '../router',
  '../viewport',
  '../core/util/showDeleteFormPage',
  '../core/pages/AddFormPage',
  '../core/pages/EditFormPage',
  './Alarm',
  './AlarmCollection',
  './pages/AlarmListPage',
  './pages/AlarmDetailsPage',
  './views/AlarmFormView',
  'i18n!app/nls/alarms'
], function(
  _,
  user,
  router,
  viewport,
  showDeleteFormPage,
  AddFormPage,
  EditFormPage,
  Alarm,
  AlarmCollection,
  AlarmsListPage,
  AlarmDetailsPage,
  AlarmFormView
) {
  'use strict';

  var canView = user.auth('ALARMS:VIEW');
  var canManage = user.auth('ALARMS:MANAGE');

  router.map('/alarms', canView, function(req)
  {
    viewport.showPage(new AlarmsListPage({
      collection: new AlarmCollection(null, {rqlQuery: req.rql})
    }));
  });

  router.map('/alarms/:id', canView, function(req)
  {
    viewport.showPage(new AlarmDetailsPage({
      model: new Alarm({_id: req.params.id}),
      eventsPage: req.query.eventsPage
    }));
  });

  router.map('/alarms;add', canManage, function()
  {
    viewport.showPage(new AddFormPage({
      FormView: AlarmFormView,
      model: new Alarm()
    }));
  });

  router.map('/alarms/:id;edit', canManage, function(req)
  {
    viewport.showPage(new EditFormPage({
      FormView: AlarmFormView,
      model: new Alarm({_id: req.params.id})
    }));
  });

  router.map('/alarms/:id;delete', canManage, showDeleteFormPage.bind(null, Alarm));

  router.map('/alarms/:id;run', canManage, _.partial(showDeleteFormPage, Alarm, _, _, {
    actionKey: 'run',
    formMethod: 'POST',
    formActionSeverity: 'primary'
  }));

  router.map('/alarms/:id;stop', canManage, _.partial(showDeleteFormPage, Alarm, _, _, {
    actionKey: 'stop',
    formMethod: 'POST',
    formActionSeverity: 'warning'
  }));

  router.map('/alarms/:id;ack', user.auth('ALARMS:ACK'), _.partial(showDeleteFormPage, Alarm, _, _, {
    actionKey: 'ack',
    formMethod: 'POST',
    formActionSeverity: 'success'
  }));
});
