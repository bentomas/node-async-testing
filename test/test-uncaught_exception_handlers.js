exports['test catch sync error'] = function(assert) {
  var e = new Error();

  this.uncaughtExceptionHandler = function(err) {
    assert.equal(e, err);
  }

  throw e;
};
exports['test catch async error'] = function(assert, finished) {
  var e = new Error();

  this.uncaughtExceptionHandler = function(err) {
    assert.equal(err, e);
    finished();
  }

  setTimeout(function() {
      throw e;
    }, 500);
};
exports['test sync error fail'] = function(assert) {
  var e = new Error();

  this.uncaughtExceptionHandler = function(err) {
    assert.ok(false, 'this fails synchronously');
  }

  throw e;
};
exports['test async error fail'] = function(assert, finished) {
  var e = new Error();

  this.uncaughtExceptionHandler = function(err) {
    assert.ok(false, 'this fails synchronously');
    finished();
  }

  setTimeout(function() {
      throw e;
    }, 500);
};
exports['test sync error async fail'] = function(assert, finished) {
  var e = new Error();

  this.uncaughtExceptionHandler = function(err) {
    process.nextTick(function() {
        assert.ok(false, 'this fails asynchronously');
        finished();
      });
  }

  throw e;
};
exports['test async error async fail'] = function(assert, finished) {
  var e = new Error();

  this.uncaughtExceptionHandler = function(err) {
    process.nextTick(function() {
        assert.ok(false, 'this fails asynchronously');
        finished();
      });
  }

  setTimeout(function() {
      throw e;
    }, 500);
};
exports['test sync error error again'] = function(assert) {
  var e = new Error('first error');

  this.uncaughtExceptionHandler = function(err) {
    throw new Error('second error');
  }

  throw e;
};
exports['test async error error again'] = function(assert, finished) {
  var e = new Error('first error');

  this.uncaughtExceptionHandler = function(err) {
    throw new Error('second error');
  }

  setTimeout(function() {
      throw e;
    }, 500);
};
exports['test sync error error again async'] = function(assert, finished) {
  var e = new Error('first error');

  this.uncaughtExceptionHandler = function(err) {
    process.nextTick(function() {
        throw new Error('second error');
      });
  }

  throw e;
};
exports['test async error error again async'] = function(assert, finished) {
  var e = new Error('first error');

  this.uncaughtExceptionHandler = function(err) {
    process.nextTick(function() {
        throw new Error('second error');
      });
  }

  setTimeout(function() {
      throw e;
    }, 500);
};

if (module == require.main) {
  require('../async_testing').run(exports, process.ARGV);
}
