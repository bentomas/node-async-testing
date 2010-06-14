var assert = require('assert')
  , path = require('path')
  , fs = require('fs')
  , sys = require('sys')
  ;

var runners = require('./runners');
exports.run = runners.def;

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
          if (err instanceof assert.AssertionError) {
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

exports.runSuite = function(obj, options) {
  // make sure options exist
  options = options || {};

  /* available options:
   *
   * + parallel: true or false, for whether or not the tests should be run
   *     in parallel or serially.  Obviously, parallel is faster, but it doesn't
   *     give as accurate error reporting
   * + testName: string, the name of a test to be ran
   * + name: string, the name of the module/suite being ran
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
    // if the testName option is set, then only add the test to the todo
    // list if the name matches
    if (!options.testName || options.testName == key) {
      state.todo.push({name: key , func: obj[key]});
      state.numTests++;
    }
  }

  // add our global error listener
  process.addListener('uncaughtException', errorHandler);

  if (state.todo.length < 1) {
    // We're done.  No tests to run.
    if (options.onSuiteDone) {
      options.onSuiteDone(options.name, []);
    }
    return;
  }

  // notify that we are starting:
  if (options.onSuiteStart) {
    options.onSuiteStart(options.name);
  }

  // start the test chain
  startNextTest();

  /******** functions ********/

  function startNextTest() {
    // pull off the next test
    var curTest = state.todo.shift();

    // break out of this loop if we don't have any more tests to run
    if (!curTest) {
      return;
    }

    // move our test to the list of started tests
    state.started.push(curTest);

    // for calculating how long a test takes
    curTest.startTime = new Date();
    // keep track of the number of assertions
    curTest.numAssertions = 0;
    // add this function to the test object because the assert wrapper needs
    // to be able to finish a test if an assertion failes
    curTest.finish = testFinished;
    // for keeping track of an uncaughtExceptionHandler
    curTest.UEHandler = null;
    // this is the object that the tests get for manipulating how the tests work
    curTest.obj =
      // we use getters and setters for the uncaughtExceptionHandler because it
      // looks nicer but we need to be able to throw an error if they are running in
      // parallel 
      { get uncaughtExceptionHandler() { return curTest.UEHandler; }
      , set uncaughtExceptionHandler(h) {
          if (options.parallel) {
            throw new Error("Cannot set an 'uncaughtExceptionHandler' when running tests in parallel");
          }
          curTest.UEHandler = h;
        }
      };

    if (options.onTestStart) {
      options.onTestStart(curTest.name);
    }

    try {
      // actually call the test
      curTest.func.call(curTest.obj, wrapAssert(curTest), function() { curTest.finish() }, curTest.obj);
    }
    catch(err) {
      // if we have an error, pass it to the error handler
      errorHandler(err);
    }

    // If the function doesn't ask for the callback function, the test is synchronous.
    // Also make sure to not call this twice.
    if (curTest.func.length < 2 && typeof curTest.finished == 'undefined') {
      curTest.finish();
    }

    // if we are supposed to run the tests in parallel, start the next test
    if (options.parallel) {
      startNextTest();
    }
  }

  // Called when a test finishes, either successfully or from an assertion error
  function testFinished(failure) {
    // calculate the time it took
    this.duration = new Date() - this.startTime;
    delete this.startTime;

    // mark it as finished
    this.finished = true;
    
    // if we had an assertion error it will be passed in
    if (failure) {
      this.failure = failure;
    }
    // otherwise, if they specified the number of assertions, let's make sure
    // they match up
    else {
      if (this.obj.numAssertionsExpected && this.obj.numAssertionsExpected != this.numAssertions) {
        this.failure = new assert.AssertionError(
           { message: 'Wrong number of assertions: ' + this.obj.numAssertionsExpected +
                           ' expected, ' + this.numAssertions + ' fired'
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

    // check to see if we are all done
    testsMightBeDone();

    // if we are running tests serially, then we need to start the next test
    if (!options.parallel) {
      process.nextTick(function() {
        startNextTest();
      });
    }
  }

  // listens for uncaught errors and keeps track of which tests they could
  // be from
  function errorHandler(err) {
    // assertions throw an error, but we can't just catch those errors, because
    // then the rest of test will run.  so, we don't catch it and it ends up
    // here. So we just ignore it.
    if (err instanceof assert.AssertionError && err.ALREADY_HANDLED) {
      delete err.ALREADY_HANDLED;
      return;
    }

    // we want to allow tests to supply a function for handling uncaught errors,
    // and since all uncaught errors come here, this is where we have to handle
    // them.
    if (!options.parallel && state.started[0].UEHandler) {
      try {
        // run the UncaughtExceptionHandler
        state.started[0].UEHandler(err);
        return;
      }
      catch(e) {
        // if the UncaughtExceptionHandler raises an Error we have to make sure
        // it is handled.

        // The error raised could be an AssertionError, in that case we don't
        // want to raise an error for that (see the above comment)...

        if (e instanceof assert.AssertionError && e.ALREADY_HANDLED) {
          delete err.ALREADY_HANDLED;
          return;
        }

        // If we get here we want to use the error in the rest of the function
        err = e;
      }
    }

    // create the result object for the test that just completed in error
    var details = {error: err, candidates: [], endTime: new Date()};
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
      process.nextTick(function() {
          startNextTest();
        });
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
      if (state.results[i].candidates && state.results[i].candidates.length == 1) {
        // get the test
        var t = state.results[i].candidates[0];
        // remove it from the list of started tests
        for(var j = 0; j < state.started.length; j++) {
          if (state.started[j] == t) {
            state.started.splice(j,1);
          }
        }

        // clean the results object a little bit
        t.error = state.results[i].error;
        t.duration = t.errors[0].endTime - t.startTime;
        delete t.errors;
        delete t.error.candidates;
        delete t.startTime;
        delete t.error.endTime;

        state.results[i] = t;

        // make sure the test is finished.
        t.finished = true;

        if (options.onTestDone) {
          options.onTestDone(formatTestResult(t));
        }
      }
    }

    // If the test errored it would have been handled by the above code.  We
    // don't want to output it twice.
    if (!test.error) {
      if (options.onTestDone) {
        options.onTestDone(formatTestResult(test));
      }
    }
  }

  function formatTestResult(result) {
    if (result.constructor == Array) {
      return {
          name: result[0].map(function(t) { return t.name; })
        , status: 'multiError'
        , errors: result[1]
        }
    }
    else if (result.failure) {
      return {
          duration: result.duration
        , name: result.name
        , status: 'failure'
        , failure: result.failure
      }
    }
    else if (result.error) {
      return {
          duration: result.duration
        , name: result.name
        , status: 'error'
        , error: result.error
        }
    }
    else {
      return {
          duration: result.duration
        , name: result.name
        , status: 'success'
        , numAssertions: result.numAssertions
      }
    }
  }

  // checks to see if we are done, and if so, runs the cleanup method
  function testsMightBeDone() {
    if (state.results.length == state.numTests) {
      testsDone();
    }
  }

  // clean up method which notifies all listeners of what happened
  function testsDone() {
    process.nextTick(function() {
      process.removeListener('uncaughtException', errorHandler);
      
      if (options.onSuiteDone) {
        //clean up the results before sending them along

        multiErrors(state.results);

        var r = [];
        for(var i = 0; i < state.results.length; i++) {
          r.push(formatTestResult(state.results[i]));
        }
        options.onSuiteDone(options.name, r);
      }
    });
  }

  // this isn't as efficient as it could be.  Basically, we 
  function multiErrors(results) {
    var multiErrors = [];
    for(var i = 0; i < results.length; i++) {
      if (results[i].candidates) {
        multiErrors.push(results[i]);
        results.splice(i, 1);
        i--;
      }
    }

    if (multiErrors.length > 0) {
      var r = [multiErrors[0].candidates,[multiErrors[0].error]];

      for(var i = 1; i < multiErrors.length; i++) {
        r[1].push(multiErrors[i].error);
        for( var j = 0; j < multiErrors[i].candidates.length; j++) {
          if (r[0].indexOf(multiErrors[i].candidates[j]) < 0) {
            r[0].push(multiErrors[i].candidates[j]);
          }
        }
      }

      if (options.onTestDone) {
        options.onTestDone(formatTestResult(r));
      }

      results.push(r);
    }
  }
}

exports.runSuites = function(list, options) {
  // make sure options exist
  options = options || {};

  /* Available options:
   *
   * + parallel: true or false, default false, for whether or not the tests
   *   should be run in parallel or serially.  Obviously, parallel is faster,
   *   but it doesn't give as accurate error reporting
   * + suiteName: string, if you want to limit which suite is run
   * + testName: string, if you want to limit which test is run
   *
   * Events:
   *
   * + onSuiteStart: function(name), when we start running tests for a file/module
   * + onSuiteDone: function(name, results), when we're done running tests for
   *   a file/module
   * + onTestStart: function(result), when we start a particular test
   * + onTestDone: function(name), when we finish a particular test
   */

  if (list.constructor != Array) {
    list = [list];
  }

  var index = 0
    , allResults = []
    , suites = []
    , explicit = []
    ;

  for(var i = 0; i < list.length; i++) {
    explicit.push(list[i]);
  }


  processNextItem();

  function processNextItem() {
    if( list.length == 0 ) {
      return runNextSuite();
    }

    var item = list.shift();

    // not a file name, but a javascript object
    if (typeof item !== 'string') {
      suites.push({suite: item});
      return processNextItem();
    }

    // must be a filename
    var file = item;
    if (file.charAt(0) !== '/') {
      file = path.join(process.cwd(),file);
    }
    fs.stat(file, function(err, stat) {
        if (err) {
          throw err;
        }

        if (stat.isFile()) {
          if (explicit.indexOf(item) >= 0 || path.basename(file).match(/^test-.*\.js$/)) {
            suites.push({suite: require(path.join(path.dirname(file), path.basename(file, path.extname(file)))), name: item});
          }
          processNextItem();
        }
        else if (stat.isDirectory()) {
          fs.readdir(file, function(err, files) {
              if (err) {
                throw err;
              }
              for(var i = 0; i < files.length; i++) {
                if (files[i].match(/^[^.]/)) {
                  list.push(path.join(file,files[i]));
                }
              }

              processNextItem();
            });
        }
      });
  }

  function runNextSuite() {
    var item = suites[index];
    index++;

    if (!item) {
      if (options.onDone) {
        options.onDone(allResults);
      }
      return;
    }

    name = item.name;
    suite = item.suite;

    var itemOpts =
      { parallel: options.parallel
      , testName: options.testName
      , name: name
      , onSuiteStart: options.onSuiteStart
      , onSuiteDone: function(name, results) {
          var failures = 0;
          var errors = 0;
          var successes = 0;

          for(var i = 0; i < results.length; i++) {
            var r = results[i];
            if (r.status == 'failure') {
              failures++;
            }
            else if (r.status == 'error') {
              errors++;
            }
            else if (r.status == 'multiError') {
              for(var j = 0; j < r.errors.length; j++) {
                errors++;
              }
            }
            else {
              successes++;
            }
          }

          allResults.push({name: name, results: results, errors: errors, failures: failures, successes: successes});

          if (options.onSuiteDone) {
            options.onSuiteDone(name, results);
          }
          process.nextTick(function() {
              runNextSuite();
            });
        }
      , onTestStart: options.onTestStart
      , onTestDone: options.onTestDone
      }

    if (!options.suiteName || options.suiteName == name) {
      exports.runSuite(suite, itemOpts);
    }
    else {
      runNextSuite();
    }
  }
}
