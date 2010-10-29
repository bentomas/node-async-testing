var running = require('./running');
exports.run = running.run;
exports.registerRunner = running.registerRunner;

var testing = require('./testing');
exports.runSuite = testing.runSuite;
exports.runFile = testing.runFile;
exports.expandFiles = testing.expandFiles;
exports.registerAssertion = testing.registerAssertion;

var wrap = require('./wrap');
exports.wrap = wrap.wrap;
