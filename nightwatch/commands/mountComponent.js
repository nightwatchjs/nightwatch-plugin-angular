const AssertionError = require('assertion-error');
const path = require('path');
const fs = require('fs').promises;
const WebpackController = require('../../src/webpackController');

class NightwatchMountError extends AssertionError {
  constructor(message) {
    super(message);

    this.name = 'NightwatchMountError';
  }
}

module.exports = class Command {
  get pluginSettings() {
    return this.client.settings['@nightwatch/angular'] || {};
  }

  #getError(message) {
    const err = new NightwatchMountError(message);

    err.showTrace = false;
    err.help = [
      'run nightwatch with --devtools and --debug flags (Chrome only)',
      'investigate the error in the browser console'
    ];

    return err;
  }

  #normaliseComponentPath(componentPath) {
    if (!path.isAbsolute(componentPath)) {
      componentPath = path.resolve(this.pluginSettings.projectRoot, componentPath);
    }

    const parts = path.parse(componentPath);

    if (parts.ext === '.ts') {
      return path.join(parts.dir, parts.name);
    }

    return componentPath;
  }

  async command(componentPath, cb = function() {}) {
    let launchUrl = '';

    if (this.api.globals.launchUrl) {
      launchUrl = this.api.globals.launchUrl;
    }

    if (WebpackController.devServerInstance) {
      const port = WebpackController.devServerInstance.options.port || 5173;
      launchUrl = `http://localhost:${port}/__/nightwatch`;
    } else {
      throw new Error('Webpack Dev Server not running');
    }

    const nightwatchCacheDir = path.join(this.pluginSettings.projectRoot, 'nightwatch', '.cache');
    const mountPointPath = path.join(nightwatchCacheDir, 'mountPoint.ts');

    componentPath = 
    await fs.writeFile(mountPointPath, `
      import  * as MountComponent from '${this.#normaliseComponentPath(componentPath)}'

      const classes = Object.keys(MountComponent)

      if(classes.length > 1) {
          throw new Error('Multiple components exported from the same file: ' + classes);
      }

      const MountPoint = (MountComponent as any)[classes[0]];

      export default MountPoint;
    `);

    const bootstrapFilePath = path.join(__dirname, '../../src/bootstrap.ts');

    await fs.copyFile(bootstrapFilePath, path.join(nightwatchCacheDir, 'bootstrap.ts'));

    // Wait for webpack compilation to finish
    if (WebpackController.compilerInstance) {
      const waitCompilation = new Promise((resolve, reject) => {
        WebpackController.compilerInstance.hooks.done.tap('done', resolve);
      });

      await waitCompilation;
    } else {
      throw new Error('Webpack Compiler not initialized');
    }

    await this.api.navigateTo(launchUrl);

    if (this.client.argv.debug) {
      await this.api.debug();
    } else if (this.client.argv.preview) {
      await this.api.pause();
    }

    const result = await this.api.execute(function() {
      // eslint-disable-next-line no-undef
      return document.querySelectorAll('#root0')[0].firstElementChild;
    });

    if (!result || result.error) {
      const err = this.#getError('Could not mount the component.');

      throw err;
    }

    const componentInstance = this.api.createElement(result, {
      isComponent: true,
      type: 'angular'
    });

    cb(componentInstance);

    return componentInstance;
  }
};