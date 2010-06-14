var testing = require('../testing');
var sys = require('sys');

function syncAssertions(options, callback) {
  return function() {
    sys.puts('\nsyncAssertions');
    testing.runTests(
      { 'test success': function(assert) {
          assert.ok(true, 'This should be true');
        }
      , 'test fail': function(assert) {
          assert.ok(false, 'This should be false');
        }
      , 'test success -- numAssertionsExpected': function(assert) {
          this.numAssertionsExpected = 1;
          assert.ok(true, 'This should be true');
        }
      , 'test fail -- numAssertionsExpected': function(assert) {
          this.numAssertionsExpected = 1;
          assert.ok(false, 'This should be false');
        }
      , 'test not enough -- numAssertionsExpected': function(assert) {
          this.numAssertionsExpected = 1;
        }
      , 'test too many -- numAssertionsExpected': function(assert) {
          this.numAssertionsExpected = 1;
          assert.ok(true, 'This should be true');
          assert.ok(true, 'This should be true');
        }
      }, options, callback);
  }
}

function asyncAssertions(options, callback) {
  return function() {
    sys.puts('\nasyncAssertions');
    testing.runTests(
      { 'test success': function(assert, finished) {
          setTimeout(function() {
              assert.ok(true, 'This should be true');
              finished();
            }, 500);
        }
      , 'test fail': function(assert, finished) {
          setTimeout(function() {
              assert.ok(false, 'This should be false');
              finished();
            }, 500);
        }
      , 'test success -- numAssertionsExpected': function(assert, finished) {
          this.numAssertionsExpected = 1;
          setTimeout(function() {
              assert.ok(true, 'This should be true');
              finished();
            }, 500);
        }
      , 'test fail -- numAssertionsExpected': function(assert, finished) {
          this.numAssertionsExpected = 1;
          setTimeout(function() {
              assert.ok(false, 'This should be false');
              finished();
            }, 500);
        }
      , 'test not enough -- numAssertionsExpected': function(assert, finished) {
          this.numAssertionsExpected = 1;
          setTimeout(function() {
              finished();
            }, 500);
        }
      , 'test too many -- numAssertionsExpected': function(assert, finished) {
          this.numAssertionsExpected = 1;
          setTimeout(function() {
              assert.ok(true, 'This should be true');
              assert.ok(true, 'This should be true');
              finished();
            }, 500);
        }
      }, options, callback);
  }
}

function errors(options, callback) {
  return function() {
    sys.puts('\nerrors');
    testing.runTests(
      { 'test sync error': function(assert) {
          throw new Error();
        }
      , 'test async error': function(assert, finished) {
          setTimeout(function() {
              throw new Error();
            }, 500);
        }
      }, options, callback);
  }
}

function uncaughtExceptionHandlers(options, callback) {
  return function() {
    sys.puts('\nuncaightExceptionHandlers');
    testing.runTests(
      { 'test catch sync error': function(assert) {
          var e = new Error();

          this.uncaughtExceptionHandler = function(err) {
            assert.equal(e, err);
          }

          throw e;
        }
      , 'test catch async error': function(assert, finished) {
          var e = new Error();

          this.uncaughtExceptionHandler = function(err) {
            assert.equal(err, e);
            finished();
          }

          setTimeout(function() {
              throw e;
            }, 500);
        }
      , 'test sync error fail': function(assert) {
          var e = new Error();

          this.uncaughtExceptionHandler = function(err) {
            assert.ok(false, 'this fails synchronously');
          }

          throw e;
        }
      , 'test async error fail': function(assert, finished) {
          var e = new Error();

          this.uncaughtExceptionHandler = function(err) {
            assert.ok(false, 'this fails asynchronously');
            finished();
          }

          setTimeout(function() {
              throw e;
            }, 500);
        }
      , 'test sync error error again': function(assert) {
          var e = new Error('first error');

          this.uncaughtExceptionHandler = function(err) {
            throw new Error('second error');
          }

          throw e;
        }
      , 'test async error error again': function(assert, finished) {
          var e = new Error('first error');

          this.uncaughtExceptionHandler = function(err) {
            throw new Error('second error');
          }

          setTimeout(function() {
              throw e;
            }, 500);
        }
      }, options, callback);
  }
}

function unfinishedTests(options, callback) {
  return function() {
    testing.runTests({
      }, options, callback);
  }
}

var options = {parallel: false};
//syncAssertions(options)();
//asyncAssertions(options)();
//errors(options)();
//uncaughtExceptionHandlers(options)();

//errors(options, uncaughtExceptionHandlers(false))();

syncAssertions(options, asyncAssertions(options, errors(options, uncaughtExceptionHandlers({parallel: false}))))();
