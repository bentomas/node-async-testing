var running = require('./running')
  , testing = require('./testing')
  ;

exports.run = running.run;
exports.registerRunner = running.registerRunner;

exports.runSuite = testing.runSuite;
exports.runFiles = testing.runFiles;
exports.expandFiles = testing.expandFiles;
exports.registerAssertion = testing.registerAssertion;

// deprecated
exports.wrapTests = function(obj, wrapper) {
  console.log('`wrapTests` is deprecated, use `wrap` instead');
  for(var key in obj) {
    obj[key] = wrapper(obj[key]);
  }
}

/* convenience function for wrapping a suite with setup and teardown
 * functions. this takes an object which has three properties:
 *
 * (by the way, I'm looking for a better name for this function)
 *
 * suite:     the test suite object, required
 * setup:     a function that should be run before the test
 * teardown:  a function that should be run after the test
 */
exports.wrap = function(obj) {
  var suite = obj.suite
    , setup = obj.setup
    , teardown = obj.teardown
    ;

  if (!suite) {
    throw new Error('Cannot wrap suite.  No suite provided');
  }

  for(var key in suite) {
    if (typeof suite[key] == 'function') {
      suite[key] = wrapper(suite[key]);
    }
    else {
      exports.wrap({suite: suite[key], setup: setup, teardown: teardown});
    }
  }

  return suite;
  
  function wrapper(func) {
    var newFunc = function(test) {
      if (teardown) {
        var finish = test.finish;
        test.finish = function() {
          teardown(test, finish);
        }
      }

      if (setup) {
        setup(test, function() { func(test); });
      }
      else {
        func(test);
      }
    }
    newFunc.toString = function() {
      return (setup ? setup+'\n' : '') + func + (teardown ? '\n'+teardown : '');
    }
    return newFunc;
  }
}

