
//require('sys')

var async_testing = require('async_testing');
if (module == require.main) {
  return async_testing.run(process.ARGV);
}

var assert = require('assert');

async_testing.registerAssertion('isTwo', 
  function isTwo(actual, message) {
    if (actual !== 2) {
      assert.fail(actual, 2, message, '==', isTwo);
    }
  });

module.exports = {
  'test custom assertion pass': function(test) {
    test.isTwo(2);
    test.finish();
  },

  'test custom assertion fail': function(test) {
    test.isTwo(1);
    test.finish();
  }
}
