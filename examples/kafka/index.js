const EventEmitter = require('events');
const mowl = require('../../index');
const KafkaProvider = require('../../src/providers/KafkaProvider');
const bus = require('../../src/middlewares/bus');
const route = require('../../src/middlewares/route');
const logger = require('../../src/helpers/logger');

// Make sure the Kafka topics `ask` and `answer` are created
// The Kafka provider does not automatically create topics

const provider1 = new KafkaProvider({
  connectionString: '127.0.0.1:9092'
});
const service1 = mowl({serviceName: 'service1', provider: provider1});
service1.use(bus());
service1.use(route());
service1.handle('answer', function(route, message) {
  logger.info(`Respond to answer: ${JSON.stringify(message)}`);
});

const provider2 = new KafkaProvider({
  connectionString: '127.0.0.1:9092'
});
const service2 = mowl({serviceName: 'service2', provider: provider2});
service2.use(bus());
service2.use(route());
service2.handle('ask', function(route, message, context) {
  logger.info(`Respond to ask: ${JSON.stringify(message)}`);
  context.bus.push('answer', 'Great, thanks!');
});

Promise.all([service1.connect(), service2.connect()]).then(() => {
  return service1.send('ask', 'How are you?')
}).catch((error) => {
  logger.error(error);
});
