const Mowl = require('./src/Mowl');

function mowl(config) {
  return new Mowl(config);
}

module.exports = mowl;
module.exports.middlewares = require('./src/middlewares');
module.exports.providers = require('./src/providers');
