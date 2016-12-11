const mowl = require('../../core');
const RabbitmqProvider = require('../../providers/rabbitmq');
const {bus, route} = require('../../core/src/middlewares');
const logger = require('../../core/src/helpers/logger');

const provider1 = new RabbitmqProvider({
  connectionString: 'amqp://guest:guest@127.0.0.1:5672/'
});
const service1 = mowl({serviceName: 'service1', provider: provider1});
service1.use(bus());
service1.use(route());
service1.handle('answer', function(route, message) {});

const provider2 = new RabbitmqProvider({
  connectionString: 'amqp://guest:guest@127.0.0.1:5672/'
});
const service2 = mowl({serviceName: 'service2', provider: provider2});
service2.use(bus());
service2.use(route());
service2.handle('ask', function(route, message, context) {
  context.bus.push('answer', 'Great, thanks!');
});

Promise.all([service1.connect(), service2.connect()]).then(() => {
  return service1.send('ask', 'How are you?')
}).catch((error) => {
  logger.error(error);
});
