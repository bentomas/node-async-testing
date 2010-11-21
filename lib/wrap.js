const PRESETUP = 0
  ,   SETUP = 1
  ,   SETUPDONE = 2
  ,   SETUPFAILED = 3
  ;

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
  console.log("returring suite!")
//  return obj.suite;
//  return obj.suite
  if (!obj.suite) {
    throw new Error('Cannot wrap suite.  No suite provided');
  }

  var state = PRESETUP
    , pendingTests = []
    , numTests = 0
    , suites = [obj.suite]
    ;


  for (var i = 0; i < suites.length; i++) {
    for(var key in suites[i]) {
      if (typeof suites[i][key] == 'function' || Array.isArray(suites[i][key])) {
        numTests++;
        suites[i][key] = wrapper(suites[i][key], key);
      }
      else {
        suites.push(suites[i][key]);
      }
    }
  }

  return obj.suite;
  
  function wrapper(func) {
    var n = Array.isArray(func) ? func : [func];

    n.unshift(obj.setup || empty);

    if (obj.suiteSetup) {
      n.unshift(function(t, f) {
        switch(state) {
          case PRESETUP: // suiteSetup hasn't been ran
            state = SETUP;
            pendingTests.push([t, f]);
            obj.suiteSetup(function setupDone() {
              state = SETUPDONE;
              for (var i = 0; i < pendingTests.length; i++) {
                pendingTests[i][1]();
              }
            });
            break;
          case SETUP: // suiteSetup is running
            pendingTests.push([t, f]);
            break;
          case SETUPDONE: // suiteSetup is done
            f();
            break;
          case SETUPFAILED: // need to fail the test
            fail(t);
            break;
        }
      });
    }
    else if (obj.suiteTeardown) {
      n.unshift(empty);
    }

    n.push(obj.teardown || empty);

    if (obj.suiteSetup || obj.suiteTeardown) {
      n.push(function(t, f) {
        switch(state) {
          case SETUP:
            // we still think suiteSetup is still running but some test just finished... oops!
            state = SETUPFAILED;
            for (var i = 0; i < pendingTests.length; i++) {
              fail(pendingTests[i][0]);
            }
            break;
          default:
            numTests--;
            if (numTests == 0 && obj.suiteTeardown) {
              obj.suiteTeardown(f);
            }
            else {
              f();
            }
        }
      });
    }

    var prevToString = func + '';
    n.toString = function() {
      var str =
        '' +
        (obj.setup ? obj.setup + '\n' : '') +
        prevToString + '\n' +
        (obj.teardown ? obj.teardown + '' : '')
        ;
      
      return str;
    }

    return n;
  }

}

function fail(test, message) {
  test.ok(false, message || 'Suite Setup failed');
}

function empty(t, f) {
  f();
}
