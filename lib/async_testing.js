var running = require('./running');
exports.run = running.run;
exports.registerRunner = running.registerRunner;

var testing = require('./testing');
exports.runSuite = testing.runSuite;
exports.runFiles = testing.runFiles;
exports.expandFiles = testing.expandFiles;
exports.registerAssertion = testing.registerAssertion;

var wrap = require('./wrap');
exports.wrap = wrap.wrap;

// deprecated
exports.wrapTests = function(obj, wrapper) {
  console.log('`wrapTests` is deprecated, use `wrap` instead');
  for(var key in obj) {
    obj[key] = wrapper(obj[key]);
  }
}

