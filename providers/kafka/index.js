const AbstractProvider = require('../../core/src/providers/AbstractProvider');
const isString = require('../../core/src/helpers/isString');
const logger = require('../../core/src/helpers/logger');
const kafka = require('no-kafka');

function validateConnectionString(connectionString) {
  if (!connectionString || !isString(connectionString)) {
    throw new Error('Mowl Kafka provider is initialized with an invalid `connectionString`, this should be a string.');
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

class KafkaProvider extends AbstractProvider {
  constructor({
    connectionString
  } = {}) {
    super();
    this.connectionString = validateConnectionString(connectionString);

    this.producer = null;
    this.consumer = null;
  }

  connect(mowl) {
    this.mowl = mowl;

    return this.connectAsConsumer();
  }

  send(route, message) {
    return this.connectAsProducer().then(() => {
      return this.producer.send({
        topic: route,
        message: {value: serialize(route, message)}
      }, {
        codec: kafka.COMPRESSION_GZIP
      })
    });
  }

  onReceive(data) {
    const [route, message] = deserialize(data);
    this.mowl.onReceive(route, message);
  }

  connectAsProducer() {
    if (this.producer) {
      return Promise.resolve();
    }
    this.producer = new kafka.Producer({
      clientId: `${this.mowl.serviceName}-client`,
      connectionString: this.connectionString
    });
    return this.producer.init().then(() => {
      logger.info(`${this.mowl.serviceName}`, 'Connection established with Kafka as producer.');
    }).catch((error) => {
      throw error;
    });
  }

  connectAsConsumer() {
    if (this.consumer) {
      return Promise.resolve();
    }
    this.consumer = new kafka.GroupConsumer({
      clientId: `${this.mowl.serviceName}-client`,
      groupId: `${this.mowl.serviceName}-group`,
      connectionString: this.connectionString
    });
    const payloads = this.mowl.handlers.map(([route, handler]) => ({topic: route}));
    return this.consumer.init([{
      subscriptions: this.mowl.handlers.map(([route, handler]) => route),
      strategy: new kafka.DefaultAssignmentStrategy(),
      handler: (messages, topic, partition) => {
        messages.forEach(({message: {value: data}}) => {
          this.onReceive(data);
        });
      }
    }]);
  }
}

module.exports = KafkaProvider;
