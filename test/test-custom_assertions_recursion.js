var async_testing = require('../lib/async_testing')
  , assert = require('assert')
  ;

  function isTwo(actual, message) {
    if (actual !== 2) {
      assert.fail(actual, 2, message, '==', isTwo);
    }
  }

async_testing.registerAssertion('isTwo', isTwo);
function isThree(actual, message) {
	isTwo(actual - 1,message);
  }
async_testing.registerAssertion('isThree', isThree);


module.exports = {
  'test custom assertion pass': function(test) {
    test.isTwo(2);
    test.finish();
  },
  'test custom assertion recusrion': function(test) {
//      assert.ok(false,"INTENSIONAL ERROR");

    isThree(2);
    test.isTwo(2);
//    test.isThree(8);
    test.finish();
  },
/*  'test custom assertion fail': function(test) {
    test.isTwo(1);
    test.finish();
  }/*/
}

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
