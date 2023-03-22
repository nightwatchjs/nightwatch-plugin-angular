const fs = require('fs').promises;
const path = require('path');

class AngularConfigurator {
  static angularDevkitModules = [
    '@angular-devkit/build-angular/src/utils/webpack-browser-config.js',
    '@angular-devkit/build-angular/src/webpack/configs/common.js',
    '@angular-devkit/build-angular/src/webpack/configs/styles.js',
    '@angular-devkit/core/src/index.js'
  ];

  constructor({projectRoot}) {
    this.projectRoot = projectRoot;
  }

  requireAngularDevkitModules() {
    const [
      {generateBrowserWebpackConfigFromContext},
      {getCommonConfig},
      {getStylesConfig},
      {logging}
    ] = AngularConfigurator.angularDevkitModules.map((dep) => {
      try {
        const depPath = require.resolve(dep, {paths: [this.projectRoot]});

        return require(depPath);
      } catch (e) {
        throw new Error(`Could not resolve "${dep}". Make sure "@angular-devkit/build-angular" and "@angular-devkit/core" installed in your angular project`);
      }
    });

    return {
      generateBrowserWebpackConfigFromContext,
      getCommonConfig,
      getStylesConfig,
      logging
    };
  }

  async getAngularJson() {

    // TODO: find angular.json in parent folder also
    const angularJsonPath = `${this.projectRoot}${path.sep}angular.json`;

    // TODO: first check if angular json is present else throw and error
    const angularJson = await fs.readFile(angularJsonPath, 'utf8');

    return JSON.parse(angularJson);
  }

  async getProjectConfig() {
    const angularJson = await this.getAngularJson();

    let {defaultProject} = angularJson;

    if (!defaultProject) {
      defaultProject = Object.keys(angularJson.projects).find((name) => angularJson.projects[name].projectType === 'application');

      if (!defaultProject) {
        throw new Error('Could not find a project with projectType "application" in "angular.json"');
      }
    }

    const defaultProjectConfig = angularJson.projects[defaultProject];

    const {architect, root, sourceRoot} = defaultProjectConfig;
    const {build} = architect;

    return {
      root,
      sourceRoot,
      buildOptions: {
        ...build.options,
        ...build.configurations?.development || {}
      }
    };
  }

  async generateTsConfig() {
    const nightwatchCachePath =  path.join(this.projectRoot, 'nightwatch', '.cache');

    const tsConfigContent = JSON.stringify({
      extends: path.join(this.projectRoot, 'tsconfig.json'),
      include: [`${nightwatchCachePath}/*.ts`]
    });

    const tsConfigPath = path.join(nightwatchCachePath, 'tsconfig.json');

    await fs.writeFile(tsConfigPath, tsConfigContent);

    return tsConfigPath;
  }

  getAngularBuildOptions(buildOptions, tsConfig) {

    //TODO: go through all the configs and check if there are unnecessary ones
    // Ref: https://github.com/angular/angular-cli/blob/main/packages/angular_devkit/build_angular/src/builders/browser/schema.json
    return {
      outputPath: 'dist/angular-app',
      assets: [],
      styles: [],
      scripts: [],
      fileReplacements: [],
      inlineStyleLanguage: 'css',
      stylePreprocessorOptions: {includePaths: []},
      resourcesOutputPath: undefined,
      commonChunk: true,
      baseHref: undefined,
      deployUrl: undefined,
      verbose: false,
      progress: false,
      i18nMissingTranslation: 'warning',
      i18nDuplicateTranslation: 'warning',
      localize: undefined,
      watch: true,
      poll: undefined,
      deleteOutputPath: true,
      preserveSymlinks: undefined,
      showCircularDependencies: false,
      subresourceIntegrity: false,
      serviceWorker: false,
      ngswConfigPath: undefined,
      statsJson: false,
      webWorkerTsConfig: undefined,
      crossOrigin: 'none',
      allowedCommonJsDependencies: [],
      buildOptimizer: false,
      optimization: false,
      vendorChunk: true,
      extractLicenses: false,
      sourceMap: true,
      namedChunks: true,
      ...buildOptions,
      aot: false,
      outputHashing: 'none',
      budgets: undefined,
      tsConfig
    };
  }

  // Source the users framework from the provided projectRoot. The framework, if available, will serve
  // as the resolve base for webpack dependency resolution.
  sourceFramework(projectRoot) {
    const sourceOfWebpack = '@angular-devkit/build-angular';


    const framework = {};

    try {
      const frameworkJsonPath = require.resolve(`${sourceOfWebpack}/package.json`, {
        paths: [projectRoot]
      });
      const frameworkPathRoot = path.dirname(frameworkJsonPath);

      // Want to make sure we're sourcing this from the user's code. Otherwise we can
      // warn and tell them they don't have their dependencies installed
      framework.importPath = frameworkPathRoot;
      framework.packageJson = require(frameworkJsonPath);

      return framework;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Framework: Failed to source framework - ', e);

      // TODO: figure out if we should throw error here
      return null;
    }
  }

  sourceWebpack(framework) {
    // TODO: make sure this is always present
    const searchRoot = framework.importPath;

    const webpackJsonPath = require.resolve('webpack/package.json', {
      paths: [searchRoot]
    });

    const importPath = path.dirname(webpackJsonPath);

    return {
      importPath,
      packageJson: require(webpackJsonPath),
      module: require(importPath)
    };
  }

  requireAngularWebpackDependencies() {
    const framework = this.sourceFramework(this.projectRoot);
    const webpack = this.sourceWebpack(framework);
    const webpackDevServer = this.sourceWebpackDevServer(framework);
    const htmlWebpackPlugin = this.sourceHtmlWebpackPlugin(framework);

    return {
      framework,
      webpack,
      webpackDevServer,
      htmlWebpackPlugin
    };
  }

  // Source the webpack-dev-server module from the provided framework or projectRoot.
  // If none is found, we fallback to the version bundled with this package.
  sourceWebpackDevServer(framework) {
    const searchRoot = framework.importPath;

    const webpackDevServer = {};

    const webpackDevServerJsonPath = require.resolve('webpack-dev-server/package.json', {
      paths: [searchRoot]
    });

    webpackDevServer.importPath = path.dirname(webpackDevServerJsonPath);
    webpackDevServer.packageJson = require(webpackDevServerJsonPath);
    webpackDevServer.module = require(webpackDevServer.importPath);

    return webpackDevServer;
  }

  createFakeContext(projectRoot, defaultProjectConfig, logging) {
    const logger = new logging.Logger('nightwatch-angular-plugin');

    const context = {
      target: {
        project: 'angular'
      },
      workspaceRoot: projectRoot,
      getProjectMetadata: () => {
        return {
          root: defaultProjectConfig.root,
          sourceRoot: defaultProjectConfig.sourceRoot,
          projectType: 'application'
        };
      },
      logger
    };

    return context;
  }

  sourceHtmlWebpackPlugin(framework) {
    const searchRoot = framework.importPath;

    const htmlWebpackPlugin = {};
    let htmlWebpackPluginJsonPath;

    try {
      htmlWebpackPluginJsonPath = require.resolve('html-webpack-plugin/package.json');

      htmlWebpackPlugin.packageJson = require(htmlWebpackPluginJsonPath);
      // Check that they're not using v3 of html-webpack-plugin. Since we should be the only consumer of it,
      // we shouldn't be concerned with using our own copy if they've shipped w/ an earlier version
    } catch (e) {
      // TODO: handle error, maybe fall back to bundled version
    }

    htmlWebpackPlugin.importPath = path.dirname(htmlWebpackPluginJsonPath),
    htmlWebpackPlugin.module = require(htmlWebpackPlugin.importPath);

    return htmlWebpackPlugin;
  }

  async createWebpackConfig() {
    // Load necessary modules from angular-devkit 
    const {
      generateBrowserWebpackConfigFromContext,
      getCommonConfig,
      getStylesConfig,
      logging
    } = this.requireAngularDevkitModules();

    const projectConfig = await this.getProjectConfig();

    // needed to add nightwatch specific files to compilation path
    const tsConfig = await this.generateTsConfig();

    const buildOptions = this.getAngularBuildOptions(projectConfig.buildOptions, tsConfig);

    const context = this.createFakeContext(this.projectRoot, projectConfig, logging);

    const {config} = await generateBrowserWebpackConfigFromContext(
      buildOptions,
      context,
      (wco) => {
        // TODO: check if necessary
        const stylesConfig = getStylesConfig(wco);

        return [getCommonConfig(wco), stylesConfig];
      }
    );

    delete config.entry.main;

    return {frameworkConfig: config, sourceWebpackModulesResult: this.requireAngularWebpackDependencies(this.projectRoot)};
  }
}

module.exports = AngularConfigurator;