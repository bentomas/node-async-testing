var assert = require('assert')
  , path = require('path')
  , fs = require('fs')
  ;

// include the default test runner as the "run" function on this module
exports.run = require('./terminal-runner').run;

// adds the assertion functions to a test, but binds them to that particular
// test so assertions are properly associated with the right test.
function addAssertionFunctions(test) {
  var assertionFunctions =
    [ 'ok'
    , 'equal'
    , 'notEqual'
    , 'deepEqual'
    , 'notDeepEqual'
    , 'strictEqual'
    , 'notStrictEqual'
    , 'throws'
    , 'doesNotThrow'
    , 'ifError'
    ];

  assertionFunctions.forEach(function(funcName) {
    test.obj[funcName] = function() {
        try {
          assert[funcName].apply(null, arguments);
          test.numAssertions++;
        }
        catch(err) {
          if (err instanceof assert.AssertionError) {
            err.TEST = test;
          }
          throw err;
        }
      }
    });
}

/* Runs a object of tests.  Each property in the object should be a
 * test.  A test is just a method.
 *
 * Available configuration options:
 *
 * + parallel: boolean, for whether or not the tests should be run in parallel
 *             or serially.  Obviously, parallel is faster, but it doesn't give
 *             as accurate error reporting
 * + testName: string, the name of a test to be ran
 * + name:     string, the name of the module/suite being ran
 *
 * Plus, there are options for the following events. These should be functions.
 *
 * + onSuiteStart
 * + onSuiteDone
 * + onTestStart
 * + onTestDone
 * + onPrematureExit
 */
exports.runSuite = function(obj, options) {
  // make sure options exists
  options = options || {};

  // keep track of internal state
  var suite =
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
      suite.todo.push({name: key , func: obj[key]});
      suite.numTests++;
    }
  }

  // Check to see if there are even any tests to run
  if (suite.todo.length < 1) {
    // Nope.  We're done.
    return testsDone();
  }

  // notify that we are starting:
  if (options.onSuiteStart) {
    options.onSuiteStart(options.name);
  }

  // add our global error listener
  process.on('uncaughtException', errorHandler);
  // add our exit listener to be able to notify about unfinished tests
  process.on('exit', exitHandler);

  suite.startTime = new Date();

  // start the test chain
  startNextTest();

  /******** functions ********/

  function startNextTest() {
    // grab the next test
    var curTest = suite.todo.shift();

    // break out of this loop if we don't have any more tests to run
    if (!curTest) {
      return;
    }

    // move our test to the list of started tests
    suite.started.push(curTest);

    // for calculating how long a test takes
    curTest.startTime = new Date();
    // keep track of the number of assertions
    curTest.numAssertions = 0;
    // add this function to the test object because the assert wrapper needs
    // to be able to finish a test if an assertion failes
    curTest.finish = testFinished;

    // for keeping track of an uncaughtExceptionHandler

    // this is the object that the tests get for manipulating how the tests work
    var testObj =
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
      , finish: function() { curTest.finish(); }
      };

    // store the testObj in the test
    curTest.obj = testObj;

    addAssertionFunctions(curTest);

    // notify listeners
    if (options.onTestStart) {
      options.onTestStart(curTest.name);
    }

    try {
      // actually call the test
      curTest.func(curTest.obj);
    }
    catch(err) {
      // if we have an error, pass it to the error handler
      errorHandler(err);
    }

    // if we are supposed to run the tests in parallel, start the next test
    if (options.parallel) {
      process.nextTick(function() {
        startNextTest();
      });
    }
  }

  // Called when a test finishes, either successfully or from an assertion error
  function testFinished(failure) {
    // calculate the time it took
    this.duration = new Date() - this.startTime;
    delete this.startTime;

    // if we had an assertion error it will be passed in
    if (failure) {
      this.failure = failure;
    }
    // otherwise
    else {
      // if they specified the number of assertions, make sure they match up
      if (this.obj.numAssertions && this.obj.numAssertions != this.numAssertions) {
        this.failure = new assert.AssertionError(
           { message: 'Wrong number of assertions: ' + this.numAssertions +
                      ' != ' + this.obj.numAssertions
           , actual: this.numAssertions
           , expected: this.obj.numAssertions
           });
      }
    }

    // remove it from the list of tests that have been started
    for(var i = 0; i < suite.started.length; i++) {
      if (suite.started[i].name == this.name) {
        suite.started.splice(i,1);
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
    var report = createTestReport(this);
    suite.results.push(report);

    // check to see if we can isolate any errors
    checkErrors();

    if (options.onTestDone) {
      // notify listener
      options.onTestDone(report);
    }

    // check to see if we are all done
    testsMightBeDone();

    // if we are running tests serially, then we need to start the next test
    if (!options.parallel) {
      process.nextTick(function() {
        startNextTest();
      });
    }
  }

  // listens for uncaught errors and keeps track of which tests they could be from
  function errorHandler(err) {
    // assertions throw an error, but we can't just catch those errors, because
    // then the rest of the test will run.  So, we don't catch it and it ends up
    // here. When that happens just finish the test.
    if (err instanceof assert.AssertionError && err.TEST) {
      err.TEST.finish(err);
      delete err.TEST;
      return;
    }

    // We want to allow tests to supply a function for handling uncaught errors,
    // and since all uncaught errors come here, this is where we have to handle
    // them.
    // (you can only handle uncaught errors when not in parallel mode
    if (!options.parallel && suite.started[0].UEHandler) {
      // an error could possibly be thrown in the UncaughtExceptionHandler, in
      // this case we do not want to call it again, so we move it
      suite.started[0].UEHandlerUsed = suite.started[0].UEHandler;
      delete suite.started[0].UEHandler;

      try {
        // run the UncaughtExceptionHandler
        suite.started[0].UEHandlerUsed(err);
        return;
      }
      catch(e) {
        // we had an error, just run our error handler function on this error
        // again.  We don't have to worry about it triggering the uncaught
        // exception handler again because we moved it just a second ago
        return errorHandler(e);
      }
    }

    // create the result object for the test that just completed in error
    var details = {error: err, candidates: [], endTime: new Date()};
    for(var i = 0; i < suite.started.length; i++) {
      // keep track of which tests were eligble to have caused this error
      details.candidates.push(suite.started[i]);
      suite.started[i].errors = suite.started[i].errors || [];
      suite.started[i].errors.push(details);
    }

    // add the result to our results array
    suite.results.push(details);

    // check to see if we can isolate any errors
    checkErrors();

    // if we are running tests serially, then a test just finished so we have
    // to start the next one
    if (!options.parallel) {
      process.nextTick(function() {
          startNextTest();
        });
    }
    else {
      // we need to make sure that the process.nextTickQueue is flushed, this
      // fixes a bug in node.  Will remove once that bug is fixed.
      process.nextTick(function() {});
    }

    // check to see if we are all done
    testsMightBeDone();
  }

  function checkErrors() {
    // any time a test finishes, we could learn more about errors that had
    // multiple candidates, so loop through and see if anything has changed
    for(var i = 0; i < suite.results.length; i++) {
      // if there is only one candidate then we can finish that test and report it
      if (suite.results[i].candidates && suite.results[i].candidates.length == 1) {
        // get the test
        var test = suite.results[i].candidates[0];
        // remove it from the list of started tests
        for(var j = 0; j < suite.started.length; j++) {
          if (suite.started[j] == test) {
            suite.started.splice(j,1);
          }
        }

        // clean the results object a little bit
        test.error = suite.results[i].error;
        test.duration = test.errors[0].endTime - test.startTime;
        delete test.errors;
        delete test.error.candidates;
        delete test.startTime;
        delete test.error.endTime;

        // store the report for the test
        suite.results[i] = createTestReport(test);

        if (options.onTestDone) {
          // notify listener
          options.onTestDone(suite.results[i]);
        }
      }
    }
  }

  // makes a nice tidy object with the results of a test, a 'result' so to speak
  function createTestReport(result) {
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

  function exitHandler() {
    if (suite.started.length > 0) {
      if (options.onPrematureExit) {
        options.onPrematureExit(suite.started.map(function(t) { return t.name; }));
      }
    }
  }

  // checks to see if we are done, and if so, runs the cleanup method
  function testsMightBeDone() {
    if (suite.results.length == suite.numTests) {
      testsDone();
    }
  }

  // clean up method which notifies all listeners of what happened
  function testsDone() {
    process.removeListener('uncaughtException', errorHandler);
    process.removeListener('exit', exitHandler);

    if (options.onSuiteDone) {
      var endTime = new Date();

      groupMultiErrors(suite.results);

      var result =
        { name: options.name
        , duration: endTime - suite.startTime
        , tests: []
        , numErrors: 0
        , numFailures: 0
        , numSuccesses: 0
        };


      for(var i = 0; i < suite.results.length; i++) {
        var r = suite.results[i];

        result.tests.push(r);

        if (r.status == 'failure') {
          result.numFailures++;
        }
        else if (r.status == 'error') {
          result.numErrors++;
        }
        else if (r.status == 'multiError') {
          for(var j = 0; j < r.errors.length; j++) {
            result.numErrors++;
          }
        }
        else {
          result.numSuccesses++;
        }
      }

      options.onSuiteDone(result);
    }
  }

  /* This isn't as efficient as it could be.  Basically, this is where we
   * analyze all the tests that finished in error and have multiple test
   * candidates.  Then we generate reports for those errors.
   * Right now it is really dumb, it just lumps all of these tests into one
   * multierror report.  However it could be smarter than that.
   *
   * TODO make this smarter!
   */
  function groupMultiErrors(results) {
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

      var report = createTestReport(r);
      if (options.onTestDone) {
        options.onTestDone(report);
      }

      results.push(report);
    }
  }
}

/* runSuites runs an array, where each element in the array can be a filename or
 * a commonjs module.
 *
 * Available configuration options:
 *
 * + parallel:  boolean, for whether or not the tests should be run in parallel
 *              or serially.  Obviously, parallel is faster, but it doesn't give
 *              as accurate error reporting
 * + testName:  string, the name of a test to be ran
 * + suiteName: string, the name of a suite to be ran
 *
 * Plus, there are options for the following events. These should be functions.
 *
 * + onStart
 * + onDone
 * + onSuiteStart
 * + onSuiteDone
 * + onTestStart
 * + onTestDone
 * + onPrematureExit
 */
exports.runFiles = function(list, options) {
  // make sure options exist
  options = options || {};

  var suites
    , startTime
    , allResults = []
    , index = 0
    ;

  exports.expandFiles(list, options.suiteName, startSuites);

  function startSuites(loaded) {
    suites = loaded;

    if (options.onStart) {
      options.onStart(suites.length);
    }

    startTime = new Date();
    runNextSuite();
  }

  function runNextSuite() {
    var item = suites[index];
    index++;

    if (!item) {
      if (options.onDone) {
        options.onDone(allResults, new Date()-startTime);
      }
      return;
    }

    var name = item.name;
    var suite = item.suite = require(item.path);

    var itemOpts =
      { parallel: options.parallel
      , testName: options.testName
      , name: name
      , onSuiteStart: options.onSuiteStart
      , onSuiteDone: function(results) {
          allResults.push(results);

          if (options.onSuiteDone) {
            options.onSuiteDone(results);
          }

          process.nextTick(function() {
              runNextSuite();
            });
        }
      , onTestStart: options.onTestStart
      , onTestDone: options.onTestDone
      , onPrematureExit: options.onPrematureExit
      }

    exports.runSuite(suite, itemOpts);
  }
}

// expandFiles takes a file name, directory name or an array composed of any
// combination of either.
// It recursively searches through directories for test files.
// It gets an absolute path to each path (original file names might be relative)
exports.expandFiles = function(list, suiteName, cb) {
  if (typeof cb === 'undefined') {
    cb = suiteName;
    suiteName = null;
  }

  if (list.constructor != Array) {
    list = [list];
  }

  var suites = []
    , explicit = []
    ;

  for(var i = 0; i < list.length; i++) {
    explicit.push(list[i]);
  }

  processNextItem();

  function foundSuite(suite) {
    if ((suiteName && suite.name == suiteName) || suites.some(function(el) { return el.path == suite.path })) {
      return;
    }

    suite.index = suites.length;
    suites.push(suite);
  }

  function processNextItem() {
    if( list.length == 0 ) {
      return cb(suites);
    }

    var item = list.shift();

    // must be a filename
    var file = item;
    if (file.charAt(0) !== '/') {
      file = path.join(process.cwd(),file);
    }
    fs.stat(file, function(err, stat) {
        if (err) {
          if (err.errno == 2) {
            require('sys').puts('No such file or directory: '+file);
            require('sys').puts('');
            processNextItem();
            return;
          }
          else {
            throw err;
          }
        }

        if (stat.isFile()) {
          // if they explicitly requested this file make sure to grab it, otherwise
          // when recursing into directories only grab files that start with
          // "test-" and end with ".js"
          if (explicit.indexOf(item) >= 0 || path.basename(file).match(/^test-.*\.js$/)) {
            var p = path.join(path.dirname(file), path.basename(file, path.extname(file)));
            foundSuite({name: item, path: p});
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
                  list.push(path.join(item,files[i]));
                }
              }

              processNextItem();
            });
        }
      });
  }
}

// convenience function for wrapping tests in a suite for setup or teardown
exports.wrapTests = function(obj, wrapper) {
  for(var key in obj) {
    obj[key] = wrapper(obj[key]);
  }
}
