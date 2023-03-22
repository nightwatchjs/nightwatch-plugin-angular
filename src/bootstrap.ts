import { CommonModule } from '@angular/common';
import { Injectable } from '@angular/core'
import {
  getTestBed,
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
