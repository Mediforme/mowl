class Bus {
  constructor() {
    this.messages = [];
  }

  push(route, message) {
    this.messages.push([route, message]);
  }
}

module.exports = Bus;
