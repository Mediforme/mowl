const AbstractProvider = require('./providers/AbstractProvider');

function validateProvider(provider) {
  // Check whether the provider is an instance of abstract provider
  if (!(provider instanceof AbstractProvider)) {
    throw new Error('Mowl is initialized with an invalid provider.');
  }
  return provider;
}

class Mowl {
  constructor({
    provider
  }) {
    // Save configs
    this.provider = validateProvider(provider);

    // Initialize
    this.middlewares = [];
    this.handlers = [];

    // Connect with provider
    this.provider.connect(this);
  }

  // Registers a middleware
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // Proxies send to provider
  send(route, message) {
    this.provider.send(route, message);
  }

  // Registers a message handler
  // Handlers are expected to be used by a routing middleware
  handle(route, handler) {
    this.handlers.push([route, handler]);
  }

  // Expected to be called by the provider when a message is received
  // Loops through the middlewares with the received route and message
  onReceive(route, message) {
    const context = {};
    const middlewares = this.middlewares;
    let n = -1;
    const next = () => {
      n++;
      if (n >= middlewares.length) {
        return Promise.resolve();
      }
      const promise = middlewares[n](route, message, context, next, this);
      if (promise && promise.then) {
        return promise.then(() => {});
      } else {
        return Promise.resolve();
      }
    }
    next().then(() => {
      console.info(`Handled ${route}: ${message}`);
    }, (error) => {
      console.error(error);
    });
  }
}

module.exports = Mowl;
