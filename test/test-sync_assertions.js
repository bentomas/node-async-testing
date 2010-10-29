if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

module.exports = {
  'test success': function(test) {
    test.ok(true, 'This should be true');
    test.finish();
  },

  'test fail': function(test) {
    test.ok(false, 'This should be false');
    test.finish();
  },

  'test success -- numAssertionsExpected': function(test) {
    test.numAssertions = 1;
    test.ok(true, 'This should be true');
    test.finish();
  },

  'test fail -- numAssertionsExpected': function(test) {
    test.numAssertions = 1;
    test.ok(false);
    test.finish();
  },

  'test fail - not enough -- numAssertionsExpected': function(test) {
    test.numAssertions = 1;
    test.finish();
  },

  'test fail - too many -- numAssertionsExpected': function(test) {
    test.numAssertions = 1;
    test.ok(true, 'This should be true');
    test.ok(true, 'This should be true');
    test.finish();
  }
};
