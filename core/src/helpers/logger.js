const GREEN = 32;
const RED = 31;
const ORANGE = 33;
const GREY = 90;

function getTimestamp() {
  return formatColor(GREY, new Date().toISOString());
}

function formatColor(color, text) {
  return `\x1b[${color}m${text}\x1b[39m`;
}

module.exports = {
  info(...args) {
    console.info(getTimestamp(), formatColor(GREEN, 'INFO'), ...args);
  },
  warn(...args) {
    console.warn(getTimestamp(), formatColor(ORANGE, 'WARN'), ...args);
  },
  error(...args) {
    console.error(getTimestamp(), formatColor(RED, 'ERROR'), ...args);
  }
};
