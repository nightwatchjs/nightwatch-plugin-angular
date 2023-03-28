describe('Angular Demo App Mount', function () {

  it('Test App Component', async function () {
    const component = await browser.mountComponent('src/app/app.component.ts');

    await browser.expect(component).text.to.equal('Welcome');
  });

  after(browser => browser.end());
});