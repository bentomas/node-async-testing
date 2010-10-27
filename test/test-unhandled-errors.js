
//using this style you must assign to module.exports, not just exports.
//in nodules it appends return exports; to end of file, which gets around this...

module.exports = {'test catch sync error': function(test) {
    var e = new Error();
    test.uncaughtExceptionHandler = function(err) {
      test.equal(e, err);
//      test.finish();
    }
    throw e;
  }
}

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}

