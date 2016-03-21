// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  '../router',
  '../viewport',
  '../user',
  './Screen',
  'i18n!app/nls/screens'
], function(
  router,
  viewport,
  user,
  Screen
) {
  'use strict';

  var canManage = user.auth('SCREENS:MANAGE');

  router.map('/screens/:id;edit', canManage, function(req)
  {
    viewport.loadPage(
      [
        'app/screens/pages/ScreenEditorPage',
        'app/screens/EditorSelection'
      ],
      function(ScreenEditorPage, EditorSelection)
      {
        return new ScreenEditorPage({
          model: {
            screen: new Screen({
              _id: req.query.id,
              name: 'Testowy ekran',
              slug: 'testowy-ekran',
              parent: null,
              background: {
                color: 'rgba(255, 255, 255, 1)',
                images: [
                  {
                    url: '/assets/factory-layout.jpg',
                    position: '0% 0%',
                    size: 'auto auto',
                    repeat: 'no-repeat',
                    origin: 'padding-box',
                    clip: 'border-box',
                    attachment: 'scroll'
                  }
                ]
              },
              width: 2105,
              height: 1263,
              components: [
                {
                  _id: 'rect.1',
                  type: 'rect',
                  name: 'Red rect',
                  parent: null,
                  width: 50,
                  height: 50,
                  x: 0,
                  y: 0,
                  background: {
                    color: 'rgba(255, 0, 0, 0.5)',
                    images: []
                  }
                },
                {
                  _id: 'rect.2',
                  type: 'rect',
                  name: 'Green rect',
                  parent: null,
                  width: 100,
                  height: 100,
                  x: 100,
                  y: 100,
                  background: {
                    color: 'rgba(0, 255, 0, 0.5)',
                    images: []
                  }
                },
                {
                  _id: 'rect.3',
                  type: 'rect',
                  name: 'Blue rect',
                  parent: null,
                  width: 200,
                  height: 100,
                  x: 600,
                  y: 500,
                  background: {
                    color: 'rgba(0, 0, 255, 0.5)',
                    images: []
                  }
                }
              ]
            }),
            selection: new EditorSelection()
          }
        });
      }
    );
  });
});
