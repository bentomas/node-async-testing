if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

module.exports = {
  'test sync error error again': function(test) {
    var e = new Error('first error');

    test.uncaughtExceptionHandler = function(err) {
      throw new Error('second error');
    }

    throw e;
  }
}
