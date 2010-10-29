if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

module.exports = {
  'test success': function(test) {
    setTimeout(function() {
        test.ok(true, 'This should be true');
        test.finish();
      }, 500);
  },

  'test fail': function(test) {
    setTimeout(function() {
        test.ok(false, 'This should be false');
        test.finish();
      }, 500);
  },

  'test success -- numAssertionsExpected': function(test) {
    test.numAssertions = 1;
    setTimeout(function() {
        test.ok(true, 'This should be true');
        test.finish();
      }, 500);
  },

  'test fail -- numAssertionsExpected': function(test) {
    test.numAssertions = 1;
    setTimeout(function() {
        test.ok(false, 'This should be false');
        test.finish();
      }, 500);
  },

  'test fail - not enough -- numAssertionsExpected': function(test) {
    test.numAssertions = 1;
    setTimeout(function() {
        test.finish();
      }, 500);
  },

  'test fail - too many -- numAssertionsExpected': function(test) {
    test.numAssertions = 1;
    setTimeout(function() {
        test.ok(true, 'This should be true');
        test.ok(true, 'This should be true');
        test.finish();
      }, 500);
  }
}
