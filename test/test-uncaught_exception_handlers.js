if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

module.exports = {
  'test catch sync error': function(test) {
    var e = new Error();

    test.uncaughtExceptionHandler = function(err) {
      test.equal(e, err);
      test.finish();
    }

    throw e;
  },

  'test catch async error': function(test) {
    var e = new Error();

    test.uncaughtExceptionHandler = function(err) {
      test.equal(err, e);
      test.finish();
    }

    setTimeout(function() {
        throw e;
      }, 500);
  },

  'test sync error fail': function(test) {
    var e = new Error();

    test.uncaughtExceptionHandler = function(err) {
      test.ok(false, 'this fails synchronously');
      test.finish();
    }

    throw e;
  },

  'test async error fail': function(test) {
    var e = new Error();

    test.uncaughtExceptionHandler = function(err) {
      test.ok(false, 'this fails synchronously');
      test.finish();
    }

    setTimeout(function() {
        throw e;
      }, 500);
  },

  'test sync error async fail': function(test) {
    var e = new Error();

    test.uncaughtExceptionHandler = function(err) {
      setTimeout(function() {
        test.ok(false, 'this fails asynchronously');
        test.finish();
      }, 500);
    }

    throw e;
  },

  'test async error async fail': function(test) {
    var e = new Error();

    test.uncaughtExceptionHandler = function(err) {
      setTimeout(function() {
        test.ok(false, 'this fails asynchronously');
        test.finish();
      }, 500);
    }

    setTimeout(function() {
        throw e;
      }, 500);
  }
}
