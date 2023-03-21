import { CommonModule } from '@angular/common';
import { Component, Injectable, Type } from '@angular/core'
import {
  getTestBed,
  TestBed,
  TestComponentRenderer,
} from '@angular/core/testing'
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing'

import MountComponent from './mountPoint'

@Injectable()
export class NightWatchAngularRenderer extends TestComponentRenderer {
  override insertRootElement (rootElId: string) {
    this.removeAllRootElements()

    const rootElement = document.querySelector('nightwatch-component-root');

    if(!rootElement) {
      throw new Error('Unable to find root element: nignightwatch-component-root');
    }

    rootElement.setAttribute('id', rootElId)
    document.body.appendChild(rootElement)
  }

  override removeAllRootElements () {
    const rootElement = document.querySelector('nightwatch-component-root');
    if(rootElement) {
      rootElement.innerHTML = ''
    }
  }
}

@Component({ selector: 'nightwatch-component-root', template: '' })
class WrapperComponent { }

/**
 * Returns the Component if Type<T> or creates a WrapperComponent
 *
 * @param {Type<T> | string} component The component you want to create a fixture of
 * @returns {Type<T> | WrapperComponent}
 */
function createComponentFixture<T> (
  component: Type<T> | string,
): Type<T | WrapperComponent> {
  if (typeof component === 'string') {
    // getTestBed().overrideTemplate is available in v14+
    // The static TestBed.overrideTemplate is available across versions
    TestBed.overrideTemplate(WrapperComponent, component)

    return WrapperComponent
  }

  return component
}

/**
 * Bootstraps the TestModuleMetaData passed to the TestBed
 *
 * @param {Type<T>} component Angular component being mounted
 * @param {MountConfig} config TestBed configuration passed into the mount function
 * @returns {MountConfig} MountConfig
 */
function bootstrapModule (
  component: any,
  config: any,
): any {
  const { componentProperties, ...testModuleMetaData } = config

  if (!testModuleMetaData.declarations) {
    testModuleMetaData.declarations = []
  }

  if (!testModuleMetaData.imports) {
    testModuleMetaData.imports = []
  }

  if (!testModuleMetaData.providers) {
    testModuleMetaData.providers = []
  }

  // check if the component is a standalone component
  if ((component as any).ɵcmp?.standalone) {
    testModuleMetaData.imports.push(component)
  } else {
    testModuleMetaData.declarations.push(component)
  }

  if (!testModuleMetaData.imports.includes(CommonModule)) {
    testModuleMetaData.imports.push(CommonModule)
  }

  return testModuleMetaData
}

/**
 * Initializes the TestBed
 *
 * @param {Type<T> | string} component Angular component being mounted or its template
 * @param {MountConfig} config TestBed configuration passed into the mount function
 * @returns {Type<T>} componentFixture
 */
function initTestBed<T> (
  component: any,
  config: any,
): any {
  const componentFixture = component

  getTestBed().configureTestingModule({
    ...bootstrapModule(componentFixture, config),
  })

  getTestBed().overrideProvider(TestComponentRenderer, { useValue: new NightWatchAngularRenderer() })

  const activeFixture =  getTestBed().createComponent(component)

  return {
    fixture: activeFixture,
    component: activeFixture.componentInstance,
  }
}

// Only needs to run once, we reset before each test
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    teardown: { destroyAfterEach: false },
  },
)

const componentFixture = initTestBed(MountComponent, {})