const assert = require('assert');
const mockery = require('mockery');
const path = require('path');
const fs = require('fs').promises;

class mockAngularConfigurator {
  constructor(settings) {
    this.settings = settings;
  }

  createWebpackConfig() {

  }
}

class mockWebpackController {
  constructor(config) {
    this.config = config;
  }

  async start() {}
}


describe('test setup', function() {

  beforeEach(function() {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  });

  afterEach(function() {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  it('should throw error if angular is not present in project root', async ()=> {
    mockery.registerMock('./angularConfigurator', mockAngularConfigurator);

    mockery.registerMock('./webpackController', mockWebpackController);

    const setup = require('../../src/setup');

    // should not throw error if angular is found
    await setup({'@nightwatch/angular': {projectRoot: 'sandbox-v15'}});

    await assert.rejects(async () => {
      await setup({});
    }, {
      name: 'Error',
      message: 'Cannot find angular project within specified projectRoot: ' + process.cwd()
    });
  });

  it('should create all support files', async ()=> {
    // make sure the directory is not present
    try {
      await fs.rm(path.resolve('sandbox-v15/nightwatch/'), {recursive: true});
    } catch (e) {
      //nothing
    }

    mockery.registerMock('./angularConfigurator', mockAngularConfigurator);

    mockery.registerMock('./webpackController', mockWebpackController);

    const setup = require('../../src/setup');

    await setup({'@nightwatch/angular': {projectRoot: 'sandbox-v15'}});

    try {
      await fs.stat(path.resolve('sandbox-v15/nightwatch/.cache/bootstrap.ts'));
    } catch (e) {
      assert.fail(e);
    }

    try {
      await fs.stat(path.resolve('sandbox-v15/nightwatch/.cache/renderer.html'));
    } catch (e) {
      assert.fail(e);
    }
  });
});