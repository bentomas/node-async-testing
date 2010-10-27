
module.exports = {
  'test sync error error again': function(test) {
    var e = new Error('first error');

    test.uncaughtExceptionHandler = function(err) {
      throw new Error('second error');
    }

    throw e;
  }
}

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
