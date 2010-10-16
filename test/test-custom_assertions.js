var async_testing = require('../lib/async_testing')
  , assert = require('assert')
  ;

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

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
