const AbstractProvider = require('../../core/src/providers/AbstractProvider');
const isString = require('../../core/src/helpers/isString');
const logger = require('../../core/src/helpers/logger');
const amqp = require('amqplib');

function validateConnectionString(connectionString) {
  if (!connectionString || !isString(connectionString)) {
    throw new Error('Mowl RabbitMQ provider is initialized with an invalid `connectionString`, this should be a string.');
  }
  return connectionString;
}

function serialize(route, message) {
  return Buffer.from(JSON.stringify([route, message]), 'utf-8');
}

function deserialize(data) {
  const [route, message] = JSON.parse(data.toString('utf-8'));
  return [route, message];
}

class RabbitmqProvider extends AbstractProvider {
  constructor({
    connectionString
  } = {}) {
    super();
    this.connectionString = validateConnectionString(connectionString);

    this.connection = null;
    this.channel = null;
  }

  connect(mowl) {
    this.mowl = mowl;

    // Assert service queue
    return this.assertQueue(mowl.serviceName).then(() => {
      // Create and bind source exchanges
      return Promise.all(mowl.handlers.map(([route, handler]) => {
        return this.assertExchange(route).then(() => {
          return this.bindQueue(mowl.serviceName, route);
        });
      }));
    }).then(() => {
      // Create errors exchange and queue and bind them
      return this.assertExchange(mowl.errorsRoute).then(() => {
        return this.assertQueue(mowl.errorsRoute);
      }).then(() => {
        return this.bindQueue(mowl.errorsRoute, mowl.errorsRoute);
      });
    }).then(() => {
      // Start consuming messages
      return this.channel.consume(mowl.serviceName, (message) => {
        if (message === null) {
          return;
        }
        this.onReceive(message.content);
        this.channel.ack(message);
      });
    });
  }

  send(route, message) {
    return this.assertExchange(route).then(() => {
      return this.channel.publish(route, route, serialize(route, message));
    });
  }

  onReceive(data) {
    const [route, message] = deserialize(data);
    this.mowl.onReceive(route, message);
  }

  connectToRabbitmq() {
    if (this.connection) {
      return Promise.resolve(this.connection);
    }
    return amqp.connect(this.connectionString).then((connection) => {
      this.connection = connection;
      return connection;
    });
  }

  createChannel() {
    if (this.channel) {
      return Promise.resolve(this.channel);
    }
    return this.connectToRabbitmq().then(() => {
      return this.connection.createChannel()
    }).then((channel) => {
      this.channel = channel;
      return channel;
    });
  }

  assertExchange(exchange) {
    return this.createChannel().then(() => {
      return this.channel.assertExchange(exchange, 'fanout', {durable: true});
    });
  }

  assertQueue(queue) {
    return this.createChannel().then(() => {
      return this.channel.assertQueue(queue, {durable: true});
    });
  }

  bindQueue(queue, exchange) {
    return this.createChannel().then(() => {
      return this.channel.bindQueue(queue, exchange);
    });
  }
}

module.exports = RabbitmqProvider;
