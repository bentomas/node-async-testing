var async_testing = require('../lib/async_testing')
  , wrap = async_testing.wrap
  ;

var extra1 = {}, extra2 = {};

module.exports = {
  'sync wrap': wrap(
    { suite:
      { 'test': function(test) {
          test.numAssertions = 5;
          test.strictEqual(test.one, extra1);
          test.strictEqual(test.two, extra2);
          test.finish();
        }
      }
    , setup: function setup(test, done) {
        test.ok(true, 'make sure we run the setup');
        test.one = extra1;
        test.two = extra2;
    
        done();
      }
    , teardown: function setup(test, done) {
        test.ok(true, 'make sure we run the teardown');
        test.one = extra1;
        test.two = extra2;
    
        done();
      }
    }),

  'async setup': wrap(
    { suite:
      { 'test': function(test) {
          test.numAssertions = 4;
          test.strictEqual(test.one, extra1);
          test.strictEqual(test.two, extra2);
          test.finish();
        }
      }
    , setup: function setup(test, done) {
        test.ok(true, 'make sure we run the setup');
        test.one = extra1;
        test.two = extra2;
    
        setTimeout(done, 500);
      }
    }),

  'async teardown': wrap(
    { suite:
      { 'test': function(test) {
          test.numAssertions = 2;
          test.finish();
        }
      }
    , teardown: function setup(test, done) {
        test.ok(true, 'make sure we run the teardown');
    
        setTimeout(done, 500);
      }
    }),
};

wrap( { suite: module.exports
      , setup: function(test, done) {
          test.ok(true, 'make sure we get to outer level setup')

          done();
        }
      });


if (module == require.main) {
  async_testing.run(__filename, process.ARGV);
}
