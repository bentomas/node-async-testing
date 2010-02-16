var sys = require('sys'),
    assert = require('assert'),
    events = require('events');

var AssertWrapper = exports.AssertWrapper = function(test) {
  var test = this.__test = test;
  var assertion_functions = [
    'ok',
    'equal',
    'notEqual',
    'deepEqual',
    'notDeepEqual',
    'strictEqual',
    'notStrictEqual',
    'throws',
    'doesNotThrow'
    ];

  assertion_functions.forEach(function(func_name) {
    this[func_name] = function() {
        try {
          assert[func_name].apply(null, arguments);
          test.__numAssertions++;
        }
        catch(err) {
          if( err instanceof assert.AssertionError ) {
            test.failed(err);
          }
        }
      }
    }, this);
};

var Test = function(name, func, suite) {
  this.assert = new AssertWrapper(this);
  this.numAssertionsExpected = null;

  this.__name = name;
  this.__func = func;
  this.__suite = suite;
  this.__promise = new events.Promise();
  this.__numAssertions = 0;
  this.__finished = false;
  this.__failure = null;
  this.__symbol = '.';
};
Test.prototype.run = function() {
  sys.puts('  Starting test "' + this.__name + '"');
  var self = this;

  try {
    this.__func(this.assert, function() { self.finish() }, this);
  }
  catch(err) {
    this.failed(err);
  }

  // they didn't ask for the finish function so assume it is synchronous
  if( this.__func.length < 2 ) {
    this.finish();
  }
};
Test.prototype.finish = function() {
  if( !this.__finished ) {
    this.__finished = true;

    if( this.__failure === null && this.numAssertionsExpected !== null ) {
      try {
        var message = this.numAssertionsExpected + (this.numAssertionsExpected == 1 ? ' assertion was ' : ' assertions were ')
                    + 'expected but ' + this.__numAssertions + ' fired';
        assert.equal(this.numAssertionsExpected, this.__numAssertions, message);
      }
      catch(err) {
        this.__failure = err;
        this.__symbol = 'F';
      }
    }

    this.__promise.emitSuccess(this.__numAssertions);
  }
};
Test.prototype.failureString = function() {
  var output = '';

  if( this.__symbol == 'F' ) {
    output += '  test "' + this.__name + '" failed: \n';
  }
  else {
    output += '  test "' + this.__name + '" threw an error: \n';
  }

  if( this.__failure.stack ) {
    this.__failure.stack.split("\n").forEach(function(line) {
        output += '  ' + line + '\n';
      });
    
  }
  else {
    output = ''+this.__failure;
  }

  return output;
};
Test.prototype.failed = function(err) {
  if( !this.__finished ) {
    this.__failure = err;
    if( err instanceof assert.AssertionError ) {
      this.__symbol = 'F';
    }
    else {
      this.__symbol = 'E';
    }
    this.finish();
  }
};

var TestSuite = exports.TestSuite = function(name) {
  this.name = name;
  this.wait = true;
  this.tests = [];
  this.numAssertions = 0;
  this.numFinishedTests = 0;
  this.numFailedTests = 0;
  this.finished = false;
  this.promise = new events.Promise();

  this._setup = null;
  this._teardown = null;

  var suite = this;
  process.addListener('exit', function() {
      if( !suite.wait ) {
        suite.finish();
      }
    });

  // I'm having trouble doing instance of tests to see if something
  // is a test suite, so i'll add a property nothing is likely to have
  this.nodeAsyncTesting = 42;
};
TestSuite.prototype.finish = function() {
  if( this.finished ) {
    return;
  }

  this.finished = true;

  var failures = [];
  var output = '  ';
  this.tests.forEach(function(t) {
      if( !t.__finished ) {
        t.finish();
      }
      if( t.__failure !== null ) {
        this.numFailedTests++;
        failures.push(t);
      }
      output += t.__symbol;
    },this);

  sys.error('');
  failures.forEach(function(t) {
      sys.error(t.failureString());
    });

  sys.error('  Results for ' + (this.name ? '"' + (this.name || '')+ '"' : 'unnamed suite') + ':');
  sys.error(output);

  output = '  ';
  output += this.tests.length + ' test' + (this.tests.length == 1 ? '' : 's') + '; ';
  output += failures.length + ' failure' + (failures.length == 1 ? '' : 's') + '; ';
  output += this.numAssertions + ' assertion' + (this.numAssertions == 1 ? '' : 's') + ' ';
  sys.error(output);

  sys.error('');

  this.promise.emitSuccess();
};

TestSuite.prototype.setup = function(func) {
  this._setup = func;
  return this;
};
TestSuite.prototype.teardown = function(func) {
  this._teardown = func;
  return this;
};
TestSuite.prototype.waitForTests = function(yesOrNo) {
  if(typeof yesOrNo == 'undefined') {
    yesOrNo = true;
  }
  this.wait = yesOrNo;
  return this;
};
TestSuite.prototype.addTests = function(tests) {
  for( var testName in tests ) {
    var t = new Test(testName, tests[testName], this);
    this.tests.push(t);
  };

  return this;
};
TestSuite.prototype.runTests = function() {
  this.runTest(0);
};
TestSuite.prototype.runTest = function(testIndex) {
  if( testIndex >= this.tests.length ) {
    return;
  }

  var t = this.tests[testIndex];

  if(this._setup) {
    this._setup.call(t,t);
  }

  var suite = this;
  var wait = suite.wait;

  if(wait) {
    // if we are waiting then let's assume we are only running one test at 
    // a time, so we can catch all errors
    var errorListener = function(err) {
      t.failed(err);
    };
    process.addListener('uncaughtException', errorListener);

    var exitListener = function() {
      sys.error("\n\nOoops! The process excited in the middle of the test '" + t.__name + "'\nDid you forget to finish it?\n");
    };
    process.addListener('exit', exitListener);
  }

  t.__promise.addCallback(function(numAssertions) {
      if(suite._teardown) {
        suite._teardown.call(t,t);
      }

      suite.numAssertions += numAssertions;
      suite.numFinishedTests++;

      if( wait ) {
        process.removeListener('uncaughtException', errorListener);
        process.removeListener('exit', exitListener);
        suite.runTest(testIndex+1);
      }

      if( suite.numFinishedTests == suite.tests.length ) {
        suite.finish();
      }
    });

  t.run();

  if( !wait ) {
    suite.runTest(testIndex+1);
  }

};

exports.runSuites = function(module, callback) {
  var suites = [];

  for( var suiteName in module ) {
    var suite = module[suiteName];

    if(suite.nodeAsyncTesting == 42) {
      suite.name = suiteName;
      suites.push(suite);
    }
  }

  var stats = {
    numSuites: 0,
    numFailed: 0
  };

  function runNextSuite() {
    if( suites.length < 1 ) {
      return callback ? callback(stats) : null;
    }
    var suite = suites.shift();
    sys.puts('Running "' + suite.name + '"');
    suite.runTests();
    suite.promise.addCallback(function() {
        stats.numSuites++;
        if( suite.numFailedTests > 0 ) {
          stats.numFailed++;
        }
        runNextSuite();
      });
  }

  runNextSuite();
};
