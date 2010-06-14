var sys = require('sys');

var assert = require('assert');

function wrapAssert(test) {
  var assertionFunctions = [
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

  var assertWrapper = {};

  assertionFunctions.forEach(function(funcName) {
    assertWrapper[funcName] = function() {
        try {
          assert[funcName].apply(null, arguments);
          test.numAssertions++;
        }
        catch(err) {
          if( err instanceof assert.AssertionError ) {
            test.finish(err);

            // we need to continue to throw an error otherwise the rest
            // of the test will keep running.  A test should stop running as
            // soon as it fails
            err.ALREADY_HANDLED = true;
            throw err;
          }
        }
      }
    });

  return assertWrapper;
}

exports.runTests = function(obj, options, callback) {
  // make sure options exist
  options = options || {};

  /* available options:
   *
   * + parallel: true or false, for whether or not the tests should be run
   *     in parallel or serially.  Obviously, parallel is faster, but it doesn't
   *     give as accurate error reporting
   *
   * + test name: string, the name of a test to be ran
   */

  // keep track of internal state
  var state =
    { todo: []
    , started: []
    , results: []
    , numTests: 0
    }

  // fill up our todo array
  for(var key in obj) {
    if (!options.name || options.name == key) {
      state.todo.push({name: key , func: obj[key]});
      state.numTests++;
    }
  }

  // add our global error listener
  process.addListener('uncaughtException', errorHandler);

  // start the test chain
  startNextTest();

  /******** functions ********/

  function startNextTest() {
    // pull off the next test
    var curTest = state.todo.shift();

    // break out of this loop if we don't have any more tests to run
    if (!curTest) { return; }

    // move our test to the list of started tests
    state.started.push(curTest);

    // state
    curTest.startTime = new Date();
    curTest.numAssertions = 0;
    curTest.finish = testFinished;
    curTest.UEHandler = null;
    curTest.obj =
      { get uncaughtExceptionHandler() { return curTest.UEHandler; }
      , set uncaughtExceptionHandler(h) {
          if(options.parallel) {
            throw new Error("Cannot set an 'uncaughtExceptionHandler' when running tests in parallel");
          }
          curTest.UEHandler = h;
        }
      };

    try {
      // actually call the test
      curTest.func.call(curTest.obj, wrapAssert(curTest), function() { curTest.finish() }, curTest.obj);
    }
    catch(err) {
      errorHandler(err);
    }

      // if they didn't call for the callback function they are synchronous
      if (curTest.func.length < 2 && typeof curTest.finished == 'undefined') {
        curTest.finish();
      }

    // if we are supposed to run the tests in parallel, start the next test
    if (options.parallel) {
      startNextTest();
    }
  }

  // called when a test finishes, either successfully or from an assertion error
  function testFinished(failure) {
    // calculate the time it took
    this.duration = new Date() - this.startTime;
    delete this.startTime;

    this.finished = true;
    
    // if we had an assertion error it will be passed in
    if (failure) {
      this.failure = failure;
    }
    // otherwise, if they specified the number of assertions, let's make sure
    // they match up
    else {
      if(this.obj.numAssertionsExpected && this.obj.numAssertionsExpected != this.numAssertions) {
        this.failure = new assert.AssertionError(
           { message: 'Wrong number of assertions'
           , actual: this.numAssertions
           , expected: this.obj.numAssertionsExpected
           });
      }
    }

    // remove it from the list of tests that have been started
    for(var i = 0; i < state.started.length; i++) {
      if (state.started[i].name == this.name) {
        state.started.splice(i,1);
      }
    }

    // if it was a candidate for an error, go through and remove its candidacy
    if (this.errors) {
      for(var i = 0; i < this.errors.length; i++) {
        var index = this.errors[i].candidates.indexOf(this);
        this.errors[i].candidates.splice(index,1);
      }
      delete this.errors;
    }

    // mark that this test has completed
    testResults(this);

    // if we are running tests serially, then we need to start the next test
    if (!options.parallel) {
      process.nextTick(function() {
        startNextTest();
      });
    }

    // check to see if we are all done
    testsMightBeDone();
  }

  // listens for uncaught errors and keeps track of which tests they could
  // be from
  function errorHandler(err) {
    if( err instanceof assert.AssertionError && err.ALREADY_HANDLED ) {
      return;
    }

    // we want to allow tests to supply a function for handling uncaught errors,
    // and since all uncaught errors come here, this is where we have to handle
    // them We don't want to do this for AssertionErrors, so we test for this
    // after we have tested for that.
    if( !options.parallel && state.started[0].UEHandler ) {
      try {
        // run the UncaughtExceptionHandler
        state.started[0].UEHandler(err);
        return;
      }
      catch(e) {
        // if the UncaughtExceptionHandler raises an Error we have to make sure
        // it is handled.

        // The error raised could be an AssertionError, in that case we don't
        // want to raise an error for that...

        if( e instanceof assert.AssertionError && e.ALREADY_HANDLED ) {
          return;
        }

        // If we get here we want to use the error in the rest of the function
        err = e;
      }
    }

    // create the result object for the test that just completed in error
    var details = {error: err, candidates: []};
    for(var i = 0; i < state.started.length; i++) {
      // keep track of which tests were eligble to have caused this error
      details.candidates.push(state.started[i]);
      state.started[i].errors = state.started[i].errors || [];
      state.started[i].errors.push(details);
    }

    // some test just completed in an error.  Call the testResults method which
    // will look at candidates and what not to try to determine who failed
    testResults(details);

    // if we are running tests serially, then a test just finished so we have
    // to start the next one
    if (!options.parallel) {
      startNextTest();
    }

    // check to see if we are all done
    testsMightBeDone();
  }

  function testResults(test) {
    state.results.push(test);

    // this isn't necessarily the best place for this, but any time a test
    // finishes, we could learn more about errors that had multiple candidates, so
    // loop through and see if anything has changed
    for(var i = 0; i < state.results.length; i++) {
      if(state.results[i].candidates && state.results[i].candidates.length == 1) {
        var t = state.results[i].candidates[0];
        for(var j = 0; j < state.started.length; j++) {
          if (state.started[j] == t) {
            state.started.splice(j,1);
          }
        }

        delete state.results[i].candidates;
        state.results[i].test = t;

        t.finished = true;

        sys.puts('test "'+t.name+'" errored');
      }
    }

    if (!test.error) {
      if( test.failure ) {
        sys.puts('test "'+test.name+'" failed');
      }
      else {
        sys.puts('test "'+test.name+'" finished');
      }
    }
  }

  // checks to see if we are done, and if so, runs the cleanup method
  function testsMightBeDone() {
    if(state.results.length == state.numTests) {
      testsDone();
    }
  }

  // clean up method which notifies all listeners of what happened
  function testsDone() {
    //sys.puts(sys.inspect(state.results));
    
    if (callback) {
      callback();
    }

    process.removeListener('uncaughtException', errorHandler);
  }
}
