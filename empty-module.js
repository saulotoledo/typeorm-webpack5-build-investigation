module.exports = new Proxy({}, {
  get: (target, property) => () => {},
});
