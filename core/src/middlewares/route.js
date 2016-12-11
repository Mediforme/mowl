function createMiddleware(routes) {
  return function route(route, message, context, next, mowl) {
    return Promise.all(mowl.handlers.map(([handlerRoute, handler]) => {
      if (route !== handlerRoute) {
        return Promise.resolve();
      }
      const promise = handler(route, message, context);
      if (promise && promise.then) {
        return promise.then(() => {});
      } else {
        return Promise.resolve();
      }
    })).then(() => {
      next();
    });
  }
}

module.exports = createMiddleware;
