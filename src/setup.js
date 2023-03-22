const fs = require('fs').promises;
const path = require('path');
const mkdirp = require('mkdirp');
const AngularConfigurator = require('./angularConfigurator');
const WebpackController = require('./webpackController');

async function verifyAngularSettings(angularSettings) {
  try {
    if (angularSettings && angularSettings.projectRoot) {
      if ((await fs.stat(angularSettings.projectRoot)).isDirectory()) {
        return true;
      }
    }
  } catch (err) {
    // nothing
  }

  const error = new Error('Missing angularRoot');
  const code = `:

    // nightwatch.conf.js

    module.exports = {
      plugins: ['@nightwatch/angular'],
      angular: {
        projectRoot: 'path/to/angular/project'
      }
    }
    `;
  error.help = ['Please ensure that "angularRoot" is configured properly in your Nightwatch config file ' + code];
  error.link = 'https://nightwatchjs.org/guide/component-testing/testing-angular-components.html';

  throw error;
}


module.exports = async function(settings) {

  await verifyAngularSettings(settings.angular);

  const nightwatchCache = path.join(settings.angular.projectRoot, 'nightwatch', '.cache');

  try {
    await fs.stat(nightwatchCache);
  } catch (err) {
    await mkdirp(nightwatchCache);
  }

  // write empty file as placeholder, will be replaced before mount
  await fs.writeFile(path.join(nightwatchCache, 'bootstrap.ts'), '');

  const configurator = new AngularConfigurator(settings.angular);
  const webpackConfig = await configurator.createWebpackConfig();

  const webpackController = new WebpackController(webpackConfig, settings);
  await webpackController.start();
};

