const mowl = require('../../core');
const TestProvider = require('../../core/src/providers/TestProvider');
const {bus, route} = require('../../core/src/middlewares');
const logger = require('../../core/src/helpers/logger');

const provider1 = new TestProvider();
const service1 = mowl({serviceName: 'service1', provider: provider1});
service1.use(bus());
service1.use(route());
service1.handle('answer', () => {});

const provider2 = new TestProvider();
const service2 = mowl({serviceName: 'service2', provider: provider2});
service2.use(bus());
service2.use(route());
service2.handle('ask', (route, message, context) => {
  context.bus.push('answer', 'Great, thanks!');
});

Promise.all([service1.connect(), service2.connect()]).then(() => {
  return service1.send('ask', 'How are you?')
}).catch((error) => {
  logger.error(error);
});
