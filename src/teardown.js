const WebpackController = require('./webpackController');


module.exports = async function() {
    await WebpackController.stop();
}