var assert = require('assert')
  , path = require('path')
  , fs = require('fs')
  ;

var runners = require('./runners');
exports.run = runners.def;

function addAssertionFunctions(test) {
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

  assertionFunctions.forEach(function(funcName) {
    test.obj[funcName] = function() {
        try {
          assert[funcName].apply(null, arguments);
          test.numAssertions++;
        }
        catch(err) {
          if (err instanceof assert.AssertionError) {
            err.TEST = test;
            throw err;
          }
        }
      }
    });
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
  process.addListener('uncaughtException', errorHandler);
  process.addListener('exit', exitHandler);

  suite.startTime = new Date();
  // start the test chain
  startNextTest();

  /******** functions ********/

  function startNextTest() {
    // pull off the next test
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
      , finished: function() { curTest.finish(); }
      };

    // notify listeners
    if (options.onTestStart) {
      options.onTestStart(curTest.name);
    }

    addAssertionFunctions(curTest);

    try {
      // actually call the test
      curTest.func.call(curTest.obj, curTest.obj);
    }
    catch(err) {
      // if we have an error, pass it to the error handler
      errorHandler(err);
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

    // if we had an assertion error it will be passed in
    if (failure) {
      this.failure = failure;
    }
    // otherwise, if they specified the number of assertions, let's make sure
    // they match up
    else {
      if (this.obj.numAssertions && this.obj.numAssertions != this.numAssertions) {
        this.failure = new assert.AssertionError(
           { message: 'Wrong number of assertions: ' + this.obj.numAssertions +
                      ' expected, ' + this.numAssertions + ' fired'
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
    var formattedTest = formatTestResult(this);
    suite.results.push(formattedTest);

    // check to see if we can isolate any errors
    checkErrors();

    if (options.onTestDone) {
      options.onTestDone(formattedTest);
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

  // listens for uncaught errors and keeps track of which tests they could
  // be from
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
    if (!options.parallel && suite.started[0].UEHandler) {
      try {
        // run the UncaughtExceptionHandler
        // an error could possibly be thrown in the UncaughtExceptionHandler, in
        // this case we do not want to call it again, so we move it
        suite.started[0].UEHandlerUsed = suite.started[0].UEHandler;
        delete suite.started[0].UEHandler;
        suite.started[0].UEHandlerUsed(err);
        return;
      }
      catch(e) {
        // if the UncaughtExceptionHandler raises an Error we have to make sure
        // it is handled.

        // The error raised could be an AssertionError, in that case we don't
        // want to raise an error for that (see the above comment)...
        if (e instanceof assert.AssertionError && e.TEST) {
          e.TEST.finish(e);
          delete e.TEST;
          return;
        }

        // If we get here we want to use the error in the rest of the function
        err = e;
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

    // check to see if we are all done
    testsMightBeDone();
  }

  function checkErrors() {
    // any time a test finishes, we could learn more about errors that had
    // multiple candidates, so loop through and see if anything has changed
    for(var i = 0; i < suite.results.length; i++) {
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

        // store the formatted result
        suite.results[i] = formatTestResult(test);

        if (options.onTestDone) {
          options.onTestDone(suite.results[i]);
        }
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

  // this isn't as efficient as it could be.  Basically, we
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

      var formatted = formatTestResult(r);
      if (options.onTestDone) {
        options.onTestDone(formatted);
      }

      results.push(formatted);
    }
  }
}

exports.runSuites = function(list, options) {
  // make sure options exist
  options = options || {};

  if (list.constructor != Array) {
    list = [list];
  }

  var index = 0
    , allResults = []
    , suites = []
    , explicit = []
    , startTime
    ;

  for(var i = 0; i < list.length; i++) {
    explicit.push(list[i]);
  }


  processNextItem();

  function processNextItem() {
    if( list.length == 0 ) {
      return startSuites();
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
          if (explicit.indexOf(item) >= 0 || path.basename(file).match(/^test-.*\.js$/)) {
            var mod = require(path.join(path.dirname(file), path.basename(file, path.extname(file))));
            suites.push({suite: mod, name: item});
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

  function startSuites() {
    if (typeof options.suiteName == 'string') {
      for(var i = 0; i < suites.length; i++) {
        if (options.suiteName != suites[i].name) {
          suites.splice(i,1);
          i--;
        }
      }
    }
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

    name = item.name;
    suite = item.suite;

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
