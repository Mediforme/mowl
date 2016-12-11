const AbstractProvider = require('./providers/AbstractProvider');
const isString = require('./helpers/isString');
const isFunction = require('./helpers/isFunction');
const logger = require('./helpers/logger');

function validateServiceName(serviceName) {
  if (!serviceName || !isString(serviceName)) {
    throw new Error('Mowl is initialized with an invalid `serviceName`, this should be a string that identifies your service.');
  }
  return serviceName;
}

function validateProvider(provider) {
  if (!(provider instanceof AbstractProvider)) {
    throw new Error('Mowl is initialized with an invalid `provider`, this should be an instance of a Mowl provider.');
  }
  return provider;
}

function validateErrorsRoute(errorsRoute) {
  if (!errorsRoute || !isString(errorsRoute)) {
    throw new Error('Mowl is initialized with an invalid `errorsRoute`, this should be a string reprensenting your errors route.');
  }
  return route;
}

function validateMiddleware(middleware) {
  if (!isFunction(middleware)) {
    throw new Error('An invalid Mowl middleware is used, this should be a function with the signature (route, message, context, next, mowl).');
  }
  return middleware;
}

function validateRoute(route) {
  if (!route || !isString(route)) {
    throw new Error('A Mowl handler is registered with an invalid route, this should be a string.');
  }
  return route;
}

function validateHandler(handler) {
  if (!isFunction(handler)) {
    throw new Error('An invalid Mowl handler is registered, this should be a function with the signature (route, message, context).');
  }
  return handler;
}

class Mowl {
  constructor({
    serviceName,
    provider,
    errorsRoute = 'errors'
  }) {
    // Save configs
    this.serviceName = validateServiceName(serviceName);
    this.provider = validateProvider(provider);
    this.errorsRoute = errorsRoute;

    // Initialize
    this.middlewares = [];
    this.handlers = [];
  }

  // Registers a middleware
  use(middleware) {
    this.middlewares.push(validateMiddleware(middleware));
  }

  // Registers a message handler
  // Handlers are expected to be used by a routing middleware
  handle(route, handler) {
    this.handlers.push([validateRoute(route), validateHandler(handler)]);
  }

  // Proxies send to provider
  send(route, message) {
    return this.provider.send(route, message).then(() => {
      logger.info(`${this.serviceName}`, `Sent message to route \`${route}\` with content \`${JSON.stringify(message)}\`.`);
    }).catch((error) => {
      logger.error(`${this.serviceName}`, `Could not send message to route \`${route}\` with content \`${JSON.stringify(message)}\`.`);
      logger.error(`${this.serviceName}`, error);
    });
  }

  // Connects with the provider to begin sending and receiving messages
  connect() {
    return this.provider.connect(this);
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
      let promise;
      try {
        promise = middlewares[n](route, message, context, next, this);
      } catch (error) {
        return Promise.reject(error);
      }
      if (promise && promise.then) {
        return promise;
      } else {
        return Promise.resolve();
      }
    }
    return next().then(() => {
      logger.info(`${this.serviceName}`, `Handled message with route \`${route}\` and content \`${JSON.stringify(message)}\`.`);
    }).catch((error) => {
      logger.error(`${this.serviceName}`, `An error has occurred while handling message with route \`${route}\` and content \`${JSON.stringify(message)}\`.`);
      logger.error(`${this.serviceName}`, error);
      this.send(this.errorsRoute, {route, message, error});
    });
  }
}

module.exports = Mowl;
