const Bus = require('../Bus');

function createMiddleware() {
  return function bus(route, message, context, next, mowl) {
    const bus = new Bus();
    context.bus = bus;
    return next().then(() => {
      Promise.all(bus.messages.map(([route, messageToSend]) => {
        return mowl.send(route, messageToSend);
      }));
    });
  }
}

module.exports = createMiddleware;
