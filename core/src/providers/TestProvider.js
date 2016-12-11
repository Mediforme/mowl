const AbstractProvider = require('./AbstractProvider');

function serialize(route, message) {
  return [route, message];
}

function deserialize(data) {
  const [route, message] = data;
  return [route, message];
}

const connections = [];

class TestProvider extends AbstractProvider {
  connect(mowl) {
    this.mowl = mowl;
    connections.push(this);
    return Promise.resolve();
  }

  send(route, message) {
    connections.forEach((connection) => {
      connection.onReceive(serialize(route, message));
    });
    return Promise.resolve();
  }

  onReceive(data) {
    setTimeout(() => {
      const [route, message] = deserialize(data);
      this.mowl.onReceive(route, message);
    });
  }
}

module.exports = TestProvider;
