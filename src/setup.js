const fs = require('fs').promises;
const path = require('path');
const mkdirp = require('mkdirp');
const AngularConfigurator = require('./angularConfigurator');
const WebpackController = require('./webpackController');


/**
 * Parse plugin settings and set default values.
 * @param {object} settings Nightwatch settings object
 * @returns 
 */
async function _parseAngularSettings(settings) {
  settings['@nightwatch/angular'] = settings['@nightwatch/angular'] || {};
  const angularSettings = settings['@nightwatch/angular'];

  try {
    angularSettings.projectRoot = angularSettings.projectRoot || './'; // default to current directory
    angularSettings.projectRoot = path.resolve(angularSettings.projectRoot);

    if ((await fs.stat(angularSettings.projectRoot)).isDirectory()) {
      return angularSettings;
    }
  } catch (err) {
    const error = new Error(`Invalid projectRoot for angular plugin: ${angularSettings.projectRoot}`);
    const code = `:

      // nightwatch.conf.js

      module.exports = {
        plugins: ['@nightwatch/angular'],
        '@nightwatch/angular': {
          projectRoot: 'path/to/angular/project'
        }
      }
      `;
    error.help = ['Please ensure that "projectRoot" is configured properly in your Nightwatch config file ' + code];
    error.link = 'https://nightwatchjs.org/guide/component-testing/testing-angular-components.html';

    throw error;
  }
}

/**
 * Verify if angular is installed in the specified project root
 * @param {string} projectRoot path to angular project
 */
function _validateProjectRoot(projectRoot) {
  try {
    require.resolve('@angular/core', {
      paths: [projectRoot]
    });
  } catch (err) {
    throw new Error(`Cannot find angular project within specified projectRoot: ${projectRoot}`);
  }
}

/**
 * Add files required to bootstrap angular component tests using webpack
 * @param {string} projectRoot path to angular project
 */
async function _addSupportFiles(projectRoot) {
  const nightwatchCachePath = path.join(projectRoot, 'nightwatch', '.cache');

  try {
    await fs.stat(nightwatchCachePath);
  } catch (err) {
    await mkdirp(nightwatchCachePath);
  }

  // write empty file as placeholder, will be replaced before mount
  await fs.writeFile(path.join(nightwatchCachePath, 'bootstrap.ts'), '');

  // copy default template
  const rendererPath = path.join(__dirname, './renderer.html');
  await fs.copyFile(rendererPath, path.join(nightwatchCachePath, 'renderer.html'));

  try {
    await fs.stat(path.join(nightwatchCachePath, 'mountPoint.ts'));
    await fs.rm(path.join(nightwatchCachePath, 'mountPoint.ts'));
  } catch (err) {
    // nothing
  }
}

/**
 * Called from global hook, configures and starts a webpack dev server for compiling and rendering angular components
 * @param {object} settings Nightwatch settings object
 */
module.exports = async function(settings) {
  const angularSettings = await _parseAngularSettings(settings);
  _validateProjectRoot(angularSettings.projectRoot);

  // eslint-disable-next-line no-console
  console.log('Starting webpack-dev-server for angular component tests...');

  await _addSupportFiles(angularSettings.projectRoot);

  const angularConfigurator = new AngularConfigurator(angularSettings);
  const webpackConfig = await angularConfigurator.createWebpackConfig();

  const webpackController = new WebpackController(webpackConfig, settings);
  await webpackController.start();

  // eslint-disable-next-line no-console
  console.log('Webpack dev server started.');
};

