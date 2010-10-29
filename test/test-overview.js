var async_testing = require('../lib/async_testing')
  , wrap = async_testing.wrap
  ;

if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}


var suiteSetupCount = 0;

module.exports =
  { 'asynchronous test': function(test) {
      setTimeout(function() {
        // make an assertion (these are just regular assertions)
        test.ok(true);
        // finish the test
        test.finish();
      },500);
    }

  , 'synchronous test': function(test) {
      test.ok(true);
      test.finish();
    }

  , 'test assertions expected': function(test) {
      test.numAssertions = 1;

      test.ok(true);
      test.finish();
    }

  , 'test catch async error': function(test) {
      var e = new Error();

      test.uncaughtExceptionHandler = function(err) {
        test.equal(e, err);
        test.finish();
      }

      setTimeout(function() {
        throw e;
      }, 500);
    }

  , 'namespace 1':
    { 'test A': function(test) {
        test.ok(true);
        test.finish();
      }
    , 'test B': function(test) {
        test.ok(true);
        test.finish();
      }
    }
  , 'namespace 2':
    { 'test A': function(test) {
        test.ok(true);
        test.finish();
      }
    , 'test B': function(test) {
        test.ok(true);
        test.finish();
      }
    }
  , 'namespace 3':
    { 'test A': function(test) {
        test.ok(true);
        test.finish();
      }
    , 'test B': function(test) {
        test.ok(true);
        test.finish();
      }
    }

  , 'namespace 4':
    { 'namespace 5':
      { 'namespace 6':
        { 'test A': function(test) {
            test.ok(true);
            test.finish();
          }
        , 'test B': function(test) {
            test.ok(true);
            test.finish();
          }
        }
      }
    }

  , 'wrapped suite': wrap(
      { suiteSetup: function(done) {
          suiteSetupCount++;
          done();
        }
      , setup: function(test, done) {
          test.extra1 = 1;
          test.extra2 = 2;
          done();
        }
      , suite:
        { 'wrapped test 1': function(test) {
            test.equal(1, suiteSetupCount);
            test.equal(1, test.extra1);
            test.equal(2, test.extra2);
            test.finish();
          }
        , 'wrapped test 2': function(test) {
            test.equal(1, suiteSetupCount);
            test.equal(1, test.extra1);
            test.equal(2, test.extra2);
            test.finish();
          }
        }
      , teardown: function(test, done) {
          // not that you need to delete these variables here, they'll get cleaned up
          // automatically, we're just doing it here as an example of running code
          // after some tests
          delete test.extra1;
          delete test.extra2;
          done();
        }
      , suiteTeardown: function(done) {
          delete suiteSetupCount;
          done();
        }
      })
}
