# @nightwatch/angular
<p align=center>
  <a href="https://nightwatchjs.org" target="_blank">
  <img alt="Nightwatch.js Logo" src="https://raw.githubusercontent.com/nightwatchjs/nightwatch-plugin-react/main/.github/assets/nightwatch-logo.png" width=200 />
  </a>
  <a href="https://angular.io/" target="_blank" style="padding-left: 15px">
  <img alt="Angular Logo" src="https://user-images.githubusercontent.com/2018070/227150972-6ba1dcca-c2d0-4a19-9858-c06cba10a179.png" width=185 />
  </a>
</p>

[![Discord][discord-badge]][discord]
[![Build Status][build-badge]][build]
[![MIT License][license-badge]][license]
[![version][version-badge]][package]

Official Nightwatch plugin which adds component testing support for Angular apps. It uses the [Webpack DevServer](https://vitejs.dev/) under the hood. Requires Nightwatch 2.4+


## Setup:
Install nightwatch angular plugin in your project:

```bash
npm install @nightwatch/angular
```

Update your [Nightwatch configuration](https://nightwatchjs.org/guide/configuration/overview.html) and add the plugin to the list:

```js
module.exports = {
  plugins: ['@nightwatch/angular'],

  // other nightwatch settings...
}
```
*Note: For the plugin to function, you must configure the path to the root directory of your angular project.*


## Usage

This plugin includes a Nightwatch commands which can be used to mount Angular components.

###  browser.mountComponent(`componentPath`, `[callback]`):
**Parameters:**
- `componentPath` – location of the component file (`/path/to/component/*.component`) to be mounted
- `callback` – an optional callback function which will be called with the component element

#### Example:
```js

it('Test Form Component', async function (browser) {
  const component = await browser.mountComponent('/src/components/Form.component');

  expect(component).text.to.equal('form-component works!');
});
```

## Configuration
### - projectRoot
Nightwatch angular plugin needs to know the root directory of the angular project for which the tests are written. By default this is set as the current directory (`'./'`). This can be overridden using the projectRoot property like this:

```js
module.exports = {

  '@nightwatch/angular': {
    projectRoot: 'path/to/angular/project' // defaults to current directory
  },

  // other nightwatch settings...
}
```
### - port
The angular plugin uses webpack dev server to compile and render angular components. By default it uses port `5173` to serve the rendered pages. This can be overridden using the following configurations:
```js
module.exports = {

  'webpack_dev_server': {
    port: 10096 // defaults to 5173
  },

  // other nightwatch settings...
}
```

# License
MIT

[build-badge]: https://github.com/nightwatchjs/nightwatch-plugin-angular/actions/workflows/node.js.yml/badge.svg?branch=main
[build]: https://github.com/nightwatchjs/nightwatch-plugin-angular/actions/workflows/node.js.yml
[version-badge]: https://img.shields.io/npm/v/@nightwatch/angular.svg?style=flat-square
[package]: https://www.npmjs.com/package/@nightwatch/angular
[license-badge]: https://img.shields.io/npm/l/@nightwatch/angular.svg?style=flat-square
[license]: https://github.com/nightwatchjs/@nightwatch/angular/blob/main/LICENSE
[discord-badge]: https://img.shields.io/discord/618399631038218240.svg?color=7389D8&labelColor=6A7EC2&logo=discord&logoColor=ffffff&style=flat-square
[discord]: https://discord.gg/SN8Da2X

