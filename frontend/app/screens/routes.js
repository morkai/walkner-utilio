// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

define([
  'app/broker',
  'app/router',
  'app/viewport',
  'app/user',
  'app/core/util/uuid',
  'app/screens/Screen',
  'i18n!app/nls/screens'
], function(
  broker,
  router,
  viewport,
  user,
  uuid,
  Screen
) {
  'use strict';

  router.map('/screens', function()
  {
    broker.publish('router.navigate', {
      url: '/screens/test;edit',
      replace: true,
      trigger: true
    });
  });

  router.map('/screens/:id;edit', function(req)
  {
    viewport.loadPage(
      [
        'app/screens/pages/ScreenEditorPage',
        'app/screens/EditorViewport',
        'app/screens/components/index'
      ],
      function(ScreenEditorPage, EditorViewport) {
        return new ScreenEditorPage({
          model: new EditorViewport(null, {
            active: true,
            screen: new Screen({
              _id: req.params.id,
              name: 'Testowy ekran',
              slug: 'testowy-ekran',
              parent: null,
              backgroundColor: 'rgba(255, 255, 255, 1)',
              backgroundImages: [
                {
                  image: 'url(/assets/icon-error.png)',
                  position: '500px 500px',
                  size: '256px 256px',
                  repeat: 'no-repeat',
                  origin: 'padding-box',
                  clip: 'border-box',
                  attachment: 'scroll'
                },
                {
                  image: 'url(/assets/icon-success.png)',
                  position: '1000px 500px',
                  size: '256px 256px',
                  repeat: 'no-repeat',
                  origin: 'padding-box',
                  clip: 'border-box',
                  attachment: 'scroll'
                },
                {
                  image: 'url(/assets/factory-layout.jpg)',
                  position: '0px 0px',
                  size: '2105px 1263px',
                  repeat: 'no-repeat',
                  origin: 'padding-box',
                  clip: 'border-box',
                  attachment: 'scroll'
                }
              ],
              width: 2105,
              height: 1263,
              components: [
                {
                  _id: uuid(),
                  cid: 'rect1',
                  type: 'app/screens/components/Rect',
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
                  _id: uuid(),
                  cid: 'rect2',
                  type: 'app/screens/components/Rect',
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
                  _id: uuid(),
                  cid: 'rect3',
                  type: 'app/screens/components/Ellipse',
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
                },
                {
                  _id: uuid(),
                  cid: 'r1',
                  type: 'app/screens/components/Rect',
                  name: 'R1',
                  parent: null,
                  width: 100,
                  height: 100,
                  x: 400,
                  y: 100,
                  background: {
                    color: 'rgba(255, 0, 0, 1)',
                    images: []
                  },
                  border: {
                    width: 1,
                    color: '#000'
                  }
                },
                {
                  _id: uuid(),
                  cid: 'r2',
                  type: 'app/screens/components/Rect',
                  name: 'R2',
                  parent: null,
                  width: 100,
                  height: 100,
                  x: 410,
                  y: 110,
                  background: {
                    color: 'rgba(0, 255, 0, 1)',
                    images: []
                  },
                  border: {
                    width: 1,
                    color: '#000'
                  }
                },
                {
                  _id: uuid(),
                  cid: 'r3',
                  type: 'app/screens/components/Rect',
                  name: 'R3',
                  parent: null,
                  width: 100,
                  height: 100,
                  x: 420,
                  y: 120,
                  background: {
                    color: 'rgba(0, 0, 255, 1)',
                    images: []
                  },
                  border: {
                    width: 1,
                    color: '#000'
                  }
                },
                {
                  _id: uuid(),
                  cid: 'r4',
                  type: 'app/screens/components/Rect',
                  name: 'R4',
                  parent: null,
                  width: 100,
                  height: 100,
                  x: 430,
                  y: 130,
                  background: {
                    color: 'rgba(255, 0, 255, 1)',
                    images: []
                  },
                  border: {
                    width: 1,
                    color: '#000'
                  }
                }
              ]
            })
          })
        });
      }
    );
  });
});
