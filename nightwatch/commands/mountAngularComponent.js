const AssertionError = require('assertion-error');
const path = require('path');
const fs = require('fs').promises;

class NightwatchMountError extends AssertionError {
  constructor(message) {
    super(message);

    this.name = 'NightwatchMountError';
  }
}

module.exports = class Command {
  get pluginSettings() {
    return this.client.settings['angular'] || {};
  }

  getError(message) {
    const err = new NightwatchMountError(message);

    err.showTrace = false;
    err.help = [
      'run nightwatch with --devtools and --debug flags (Chrome only)',
      'investigate the error in the browser console'
    ];

    return err;
  }

  async command(componentName, opts = {}, cb = function() {}) {
    let launchUrl = '';

    if (this.api.globals.launchUrl) {
      launchUrl = this.api.globals.launchUrl;
    }

    if (global.webpackDevServer) {
      const port = global.webpackDevServer.options.port || 5173;
      launchUrl = `http://localhost:${port}/__/nightwatch`;
    } else {
      throw new Error('Webpack Dev Server not running');
    }

    const nightwatchCacheDir = path.join(this.pluginSettings.projectRoot, 'nightwatch', '.cache');
    const mountPointPath = path.join(nightwatchCacheDir, 'mountPoint.ts');

    await fs.writeFile(mountPointPath, `
      import  * as MountComponent from '${componentName}'

      const classes = Object.keys(MountComponent)

      if(classes.length > 1) {
          throw new Error('Multiple components exported from the same file: ' + classes);
      }

      const MountPoint = (MountComponent as any)[classes[0]];

      export default MountPoint;
    `);

    const bootstrapFilePath = path.join(__dirname, '../../src/bootstrap.ts');

    await fs.copyFile(bootstrapFilePath, path.join(nightwatchCacheDir, 'bootstrap.ts'));

    await this.api.navigateTo(launchUrl);

    if (this.client.argv.debug) {
      await this.api.debug();
    } else if (this.client.argv.preview) {
      await this.api.pause();
    }

    return true;
  }
};