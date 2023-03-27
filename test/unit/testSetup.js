const assert = require('assert');
const mockery = require('mockery');

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


describe('Angular Nightwatch Plugin test setup', function() {

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

    await assert.rejects(async () => {
      await setup({});
    }, {
      name: 'Error',
      message: 'Cannot find angular project within specified projectRoot: ' + process.cwd()
    });
  });
});