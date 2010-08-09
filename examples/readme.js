// This file contains all the examples mentioned in the readme
var async_testing = require('../lib/async_testing');

exports['asynchronousTest'] = function(test) {
  setTimeout(function() {
    // make an assertion (these are just commonjs assertions)
    test.ok(true);
    // finish the test
    test.finish();
  },50);
};

exports['synchronousTest'] = function(test) {
  test.ok(true);
  test.finish();
};

exports['test assertions expected (fails)'] = function(test) {
  test.numAssertions = 3;

  test.ok(true);
  test.finish();
  // this test will fail!
}

exports['test catch sync error'] = function(test) {
  var e = new Error();

  test.uncaughtExceptionHandler = function(err) {
    test.equal(e, err);
    test.finish();
  }

  throw e;
};

exports['wrapped test'] = function(test, one, two) {
  test.equal(1, one);
  test.equal(2, two);
  test.finish();
};

function setup(testFunc) {
  return function newTestFunc(test) {
    var extra1 = 1;
    var extra2 = 2;
    testFunc(test, extra1, extra2);
  }
}

async_testing.wrapTests(exports, setup);

if (module == require.main) {
  async_testing.run(__filename, process.ARGV);
}
