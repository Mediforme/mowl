const EventEmitter = require('events');
const mowl = require('../../index');
const TestProvider = require('../../src/providers/TestProvider');
const bus = require('../../src/middlewares/bus');
const route = require('../../src/middlewares/route');

const provider1 = new TestProvider();
const service1 = mowl({provider: provider1});
service1.use(bus());
service1.use(route());
service1.handle('answer', function(route, message) {
  console.info(`Respond to answer: ${message}`);
});

const provider2 = new TestProvider();
const service2 = mowl({provider: provider2});
service2.use(bus());
service2.use(route());
service2.handle('ask', function(route, message, context) {
  console.info(`Respond to ask: ${message}`);
  context.bus.push('answer', 'Great, thanks!');
});

service1.send('ask', 'How are you?');
