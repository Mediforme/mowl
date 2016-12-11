class AbstractProvider {
  connect(mowl) {
    throw new Error('Mowl provider must implement `connect(mowl)`.')
  }

  send(route, message) {
    throw new Error('Mowl provider must implement `send(route, message)`.')
  }
}

module.exports = AbstractProvider;
