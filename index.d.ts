import { NightwatchAPI, Element } from 'nightwatch';

declare module 'nightwatch' {
  interface NightwatchAPI {
    mountComponent(
      componentPath: string,
      callback?: (this: NightwatchAPI, result: Element) => void
    ): Awaitable<this, Element>;
  }
}
