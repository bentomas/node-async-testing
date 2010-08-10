// This file contains all the examples mentioned in the readme
var async_testing = require('../lib/async_testing');

// create suite:
exports['asynchronousTest'] = function(test) {
  setTimeout(function() {
    // make an assertion (these are just regular assertions)
    test.ok(true);
    // finish the test
    test.finish();
  },500);
};

exports['synchronousTest'] = function(test) {
  test.ok(true);
  test.finish();
};

exports['test assertions expected'] = function(test) {
  test.numAssertions = 1;

  test.ok(true);
  test.finish();
}

exports['test catch async error'] = function(test) {
  var e = new Error();

  test.uncaughtExceptionHandler = function(err) {
    test.equal(e, err);
    test.finish();
  }

  setTimeout(function() {
      throw e;
    }, 500);
};

exports['wrapped test'] = function(test, one, two) {
  test.equal(1, one);
  test.equal(2, two);
  test.finish();
};

function setup(testFunc) {
  return function newTestFunc(test) {
    // run set up code here...
    var extra1 = 1;
    var extra2 = 2;

    // pass the variables we just created to our the original test function
    testFunc(test, extra1, extra2);
  }
}

async_testing.wrapTests(exports, setup);

// if this module is the script being run, then run the tests:
if (module == require.main) {
  async_testing.run(__filename, process.ARGV);
}
