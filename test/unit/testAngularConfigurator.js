const fs = require('fs').promises;
const path = require('path');
const assert = require('assert');
const mkdirp = require('mkdirp');
const AngularConfigurator = require('../../src/angularConfigurator');


describe('test angular configurator', function() {

  it('should throw error if devkit modules are not present', async ()=> {
    const configurator = new AngularConfigurator({projectRoot: './'});
    await assert.rejects(async () => {
      await configurator.createWebpackConfig();
    },
    {
      name: 'Error',
      message: 'Could not resolve "@angular-devkit/build-angular/src/utils/webpack-browser-config.js". Make sure "@angular-devkit/build-angular" and "@angular-devkit/core" installed in your angular project'
    }
    );
  });

  it('should create typescript config', async ()=> {
    try {
      await fs.rm(path.resolve('sandbox-v15/nightwatch/'), {recursive: true});
    } catch (e) {
      //nothing
    }

    const nightwatchCachePath = path.resolve('sandbox-v15', 'nightwatch', '.cache');

    try {
      await fs.stat(nightwatchCachePath);
    } catch (err) {
      await mkdirp(nightwatchCachePath);
    }

    // write empty file as placeholder, will be replaced before mount
    await fs.writeFile(path.join(nightwatchCachePath, 'bootstrap.ts'), '');

    const configurator = new AngularConfigurator({projectRoot: path.resolve('sandbox-v15')});

    await configurator.createWebpackConfig();

    try {
      await fs.stat(path.resolve('sandbox-v15/nightwatch/.cache/tsconfig.json'));
    } catch (e) {
      assert.fail(e);
    }
  });
});