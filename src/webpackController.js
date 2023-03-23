class WebpackController {
  static publicPath = '/__/nightwatch';
  static defaultRenderer = 'nightwatch/.catch/renderer.html';

  constructor(config, settings) {
    this.webpackConfig = config;
    this.angularSettings = settings['@nightwatch/angular'] || {};
    this.devServerSettings = settings.webpack_dev_server || {};
  }

  webpackDevServer(compiler) {
    const WebpackDevServer = this.webpackConfig.sourceWebpackModulesResult.webpackDevServer.module;

    const webpackDevServerConfig = {
      host: '127.0.0.1',
      port: this.devServerSettings.port || 5173,
      devMiddleware: {
        publicPath: WebpackController.publicPath,
        stats: 'errors-only',
        writeToDisk: true
      },
      hot: false,
      liveReload: true
    };


    const server = new WebpackDevServer(webpackDevServerConfig, compiler);

    return {
      server,
      compiler
    };
  }

  async createWebpackDevServer() {
    const {
      sourceWebpackModulesResult: {
        webpack: {
          module: webpack
        }
      }
    } = this.webpackConfig;

    this.webpackConfig.frameworkConfig.watch = false;

    this.webpackConfig.frameworkConfig.entry = {
      polyfills: ['zone.js'],
      'angular-bootstrap': 'nightwatch/.cache/bootstrap.ts'
    };

    const htmlWebpackPlugin = this.webpackConfig.sourceWebpackModulesResult.htmlWebpackPlugin.module;

    this.webpackConfig.frameworkConfig.plugins.push(new htmlWebpackPlugin({
      template: this.angularSettings.htmlTemplate || WebpackController.defaultRenderer
    }));

    this.webpackConfig.frameworkConfig.output.publicPath =  WebpackController.publicPath;

    const webpackCompiler = webpack(this.webpackConfig.frameworkConfig);

    return this.webpackDevServer(webpackCompiler);
  }

  async start() {
    const {server, compiler} = await this.createWebpackDevServer();
    global.webpackDevServer = server;
    global.webpackCompiler = compiler;

    const waitCompilation = new Promise((resolve, reject) => {
      compiler.hooks.done.tap('done', resolve);
    });

    await server.start();

    if (!server.options.port) {
      throw new Error(`Failed to start webpack-dev-server on port: ${server.options.port}`);
    }

    return waitCompilation;
  }

  static async stop() {
    if (global.webpackDevServer) {
      await global.webpackDevServer.stop();
    }
  }
}

module.exports = WebpackController;