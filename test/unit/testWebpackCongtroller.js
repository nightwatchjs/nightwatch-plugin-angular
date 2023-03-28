const assert = require('assert');
const WebpackController = require('../../src/webpackController');


describe('test webpack controller', ()=> {

  it.only('should run webpack dev server', async ()=> {

    let port;
    var startCalled = false;

    class MockHtmlWebpackPlugin {
      constructor() {}
    }

    class MockWebpackDevServer {
      constructor() {}

      get options() {
        return {
          port
        };
      }
      async start() {
        startCalled = true;
      }
    }

    const config = {
      sourceWebpackModulesResult: {
        webpack: {
          module: () => {
            return {
              hooks: {
                done: {
                  tap: (_, resolve) => {
                    resolve();
                  }
                }
              }
            };
          }
        },
        htmlWebpackPlugin: {
          module: MockHtmlWebpackPlugin
        },
        webpackDevServer: {
          module: MockWebpackDevServer
        }
      },
      frameworkConfig: {
        plugins: [],
        output: {}
      }
    };

    const settings = {};

    const webpackController = new WebpackController(config, settings);
    await assert.rejects(async () => {
      await webpackController.start();
    }, {
      name: 'Error',
      message: 'Failed to start webpack-dev-server on port: 5173'
    });

    assert.ok(startCalled);

    port = 9999;
    startCalled = false;

    const webpackController2 = new WebpackController(config, settings);
    await webpackController2.start();

    assert.ok(startCalled);
  });
});