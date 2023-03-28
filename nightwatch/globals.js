const setup = require('../src/setup.js');
const teardown = require('../src/teardown.js');

module.exports = {
  async beforeChildProcess(settings) {
    await setup(settings);
  },

  async before(settings) {
    if (settings && !settings.parallel_mode && !settings.testWorkersEnabled) {
      await setup(settings);
    }
  },

  async after() {
    await teardown();
  },

  async afterChildProcess() {
    await teardown();
  }
};