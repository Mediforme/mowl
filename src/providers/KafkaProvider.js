const AbstractProvider = require('./AbstractProvider');

function serialize(route, message) {
  return JSON.stringify([route, message]);
}

function deserialize(data) {
  const [route, message] = JSON.parse(data);
  return [route, message];
}

class KafkaProvider extends AbstractProvider {
  connect(mowl) {
    this.mowl = mowl;
    // TODO: Subscribe to Kafka
  }

  send(route, message) {
    // TODO: Publish to Kafka
  }

  onReceive(data) {
    const [route, message] = deserialize(data);
    this.mowl.onReceive(route, message);
  }
}

module.exports = KafkaProvider;
