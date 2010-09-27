var async_testing = require('../lib/async_testing')
  , wrap = async_testing.wrap
  ;

var extra1 = {}, extra2 = {};

module.exports = {
  'test wrapped': function(test) {
    test.numAssertions = 4;
    test.strictEqual(test.one, extra1);
    test.strictEqual(test.two, extra2);
    test.finish();
  }
};

wrap({ suite: module.exports
     , setup: function setup(test, done) {
         test.ok(true, 'make sure we run the setup');
         test.one = extra1;
         test.two = extra2;

         done();
       }
     , teardown: function teardown(test, done) {
         test.ok(true, 'make sure we run the teardown');

         done();
       }
     });

if (module == require.main) {
  async_testing.run(__filename, process.ARGV);
}
