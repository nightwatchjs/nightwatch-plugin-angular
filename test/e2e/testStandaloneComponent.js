describe('Angular standalone component mount', function () {

  it('Test Standalone Component', async function () {
    const component = await browser.mountComponent('src/app/standalone-component/standalone-component.component.ts');

    await browser.expect(component).text.to.equal('standalone-component works!');
  });

  after(browser => browser.end());
});