const assert = require('assert');


describe('Angular Demo Form Mount', function () {

  it('Test Form Component', async function () {
    const component = await browser.mountComponent('src/app/my-form/my-form.component');

    if (component instanceof Error) {
      assert.fail(component);
    }

    await browser.expect(component).text.to.equal('my-from works foo!');

  });

  after(browser => browser.end());
});