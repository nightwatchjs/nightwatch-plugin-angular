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

  _loadAngularDevkitModules() {
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

  async _loadAngularJson() {
    const angularJsonPath = path.resolve(this.projectRoot, 'angular.json');

    try {
      const angularJson = await fs.readFile(angularJsonPath, 'utf8');

      return JSON.parse(angularJson);
    } catch (err) {
      throw new Error(`Failed to load angular.json from angular project: ${angularJsonPath}`);
    }
  }

  async _getProjectConfig() {
    const angularJson = await this._loadAngularJson();

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

    const developmentConfiguration = build.configurations && build.configurations.development ? build.configurations.development : {};

    return {
      root,
      sourceRoot,
      buildOptions: {
        ...build.options,
        ...developmentConfiguration
      }
    };
  }

  async _generateTsConfig() {
    const nightwatchCachePath =  path.join(this.projectRoot, 'nightwatch', '.cache');

    const tsConfigContent = JSON.stringify({
      extends: path.join(this.projectRoot, 'tsconfig.json'),
      include: [`${nightwatchCachePath}/*.ts`]
    });

    const tsConfigPath = path.join(nightwatchCachePath, 'tsconfig.json');

    await fs.writeFile(tsConfigPath, tsConfigContent);

    return tsConfigPath;
  }

  _getAngularBuildOptions(buildOptions, tsConfig) {

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

  _sourceFramework(projectRoot) {
    const sourceOfWebpack = '@angular-devkit/build-angular';


    const framework = {};

    try {
      const frameworkJsonPath = require.resolve(`${sourceOfWebpack}/package.json`, {
        paths: [projectRoot]
      });
      const frameworkPathRoot = path.dirname(frameworkJsonPath);


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

  _sourceWebpack(framework) {
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

  _sourceWebpackDevServer(framework) {
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

  _sourceHtmlWebpackPlugin() {
    const htmlWebpackPlugin = {};
    let htmlWebpackPluginJsonPath;

    try {
      htmlWebpackPluginJsonPath = require.resolve('html-webpack-plugin/package.json');

      htmlWebpackPlugin.packageJson = require(htmlWebpackPluginJsonPath);
    } catch (e) {
      // TODO: handle error, maybe fall back to bundled version
    }

    htmlWebpackPlugin.importPath = path.dirname(htmlWebpackPluginJsonPath),
    htmlWebpackPlugin.module = require(htmlWebpackPlugin.importPath);

    return htmlWebpackPlugin;
  }

  _requireAngularWebpackDependencies() {
    const framework = this._sourceFramework(this.projectRoot);
    const webpack = this._sourceWebpack(framework);
    const webpackDevServer = this._sourceWebpackDevServer(framework);
    const htmlWebpackPlugin = this._sourceHtmlWebpackPlugin(framework);

    return {
      framework,
      webpack,
      webpackDevServer,
      htmlWebpackPlugin
    };
  }

  _createFakeContext(projectRoot, defaultProjectConfig, logging) {
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

  async createWebpackConfig() {
    // Load necessary modules from angular-devkit 
    const {
      generateBrowserWebpackConfigFromContext,
      getCommonConfig,
      getStylesConfig,
      logging
    } = this._loadAngularDevkitModules();

    const projectConfig = await this._getProjectConfig();

    // needed to add nightwatch specific files to compilation path
    const tsConfig = await this._generateTsConfig();

    const buildOptions = this._getAngularBuildOptions(projectConfig.buildOptions, tsConfig);

    const context = this._createFakeContext(this.projectRoot, projectConfig, logging);

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

    return {frameworkConfig: config, sourceWebpackModulesResult: this._requireAngularWebpackDependencies(this.projectRoot)};
  }
}

module.exports = AngularConfigurator;