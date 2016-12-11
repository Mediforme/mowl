const AbstractProvider = require('./AbstractProvider');
const kafka = require('no-kafka');
const logger = require('../helpers/logger');

function serialize(route, message) {
  return Buffer.from(JSON.stringify([route, message]), 'utf-8');
}

function deserialize(data) {
  const [route, message] = JSON.parse(data.toString('utf-8'));
  return [route, message];
}

function convertRouteToTopic(route) {
  // For simplicity, we treat topic and route as equivalents
  return route;
}

function convertTopicToRoute(topic) {
  // For simplicity, we treat topic and route as equivalents
  return topic;
}

class KafkaProvider extends AbstractProvider {
  constructor({
    connectionString = '127.0.0.1:9092'
  } = {}) {
    super();
    this.connectionString = connectionString;
  }

  connect(mowl) {
    this.mowl = mowl;

    // Connect to Kafka as consumer
    return this.connectAsConsumer();
  }

  send(route, message) {
    return this.connectAsProducer().then(() => {
      return this.producer.send({
        topic: convertRouteToTopic(route),
        message: {value: serialize(route, message)}
      }, {
        codec: kafka.COMPRESSION_GZIP
      })
    });
  }

  onReceive(data) {
    const [route, message] = data;
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
    const payloads = this.mowl.handlers.map(([route, handler]) => ({topic: convertRouteToTopic(route)}));
    return this.consumer.init([{
      subscriptions: this.mowl.handlers.map(([route, handler]) => convertRouteToTopic(route)),
      strategy: new kafka.DefaultAssignmentStrategy(),
      handler: (messages, topic, partition) => {
        messages.forEach(({message: {value: data}}) => {
          const [route, message] = deserialize(data);
          this.mowl.onReceive(route, message);
        });
      }
    }]);
  }
}

module.exports = KafkaProvider;
