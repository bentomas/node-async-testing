var assert = require('assert')
  , path = require('path')
  , fs = require('fs')
  ;

/* Runs an object of tests.  Each property in the object should be a
 * test.  A test is just a method.
 *
 * Available configuration options:
 *
 * + parallel: boolean, for whether or not the tests should be run in parallel
 *             or serially.  Obviously, parallel is faster, but it doesn't give
 *             as accurate error reporting
 * + testName: string or array of strings, the name of a test to be ran
 * + name:     string, the name of the suite being ran
 *
 * Plus, there are options for the following events. These should be functions.
 * See API.md for a description of these events.
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
    { started: []
    , results: []
    , errored: []
    }

  suite.todo = exports.getTestsFromObject(obj, options.testName);

  if (suite.todo.length < 1) { // No tests to run
    return suiteFinished();
  }

  if (options.onSuiteStart) {
    // TODO also pass the number of tests?
    options.onSuiteStart(options.name);
  }

  process.on('uncaughtException', errorHandler);
  process.on('exit', exitHandler);

  suite.startTime = new Date();

  // start the test chain
  startNextTest();

  /******** functions ********/

  function startNextTest() {
    // grab the next test
    var curTest = suite.todo.shift();

    if (!curTest) {
      return;
    }

    // move our test to the list of started tests
    suite.started.push(curTest);

    curTest.startTime = new Date();
    // keep track of the number of assertions made
    curTest.numAssertions = 0;

    // this is the object that the tests get for manipulating how the tests work
    var testObj =
      { get uncaughtExceptionHandler() { return curTest.UEHandler; }
      , set uncaughtExceptionHandler(h) {
          if (options.parallel) {
            throw new Error("Cannot set an 'uncaughtExceptionHandler' when running tests in parallel");
          }
          curTest.UEHandler = h;
        }
      , finish: function() { testFinished(curTest); }
      };

    // store the testObj in the test
    curTest.obj = testObj;

    addAssertionFunctions(curTest);

    if (options.onTestStart) {
      // notify listeners
      options.onTestStart(curTest.name);
    }

    try {
      // actually run the test
      // TODO pass finish function?
      curTest.func(curTest.obj);
    }
    catch(err) {
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
  function testFinished(test, problem) {
    // calculate the time it took
    test.duration = test.duration || (new Date() - test.startTime);

    if (problem) {
      test.failure = problem;
    }
    else {
      // if they specified the number of assertions, make sure they match up
      if (test.obj.numAssertions && test.obj.numAssertions != test.numAssertions) {
        test.failure = new assert.AssertionError(
           { message: 'Wrong number of assertions: ' + test.numAssertions +
                      ' != ' + test.obj.numAssertions
           , actual: test.numAssertions
           , expected: test.obj.numAssertions
           });
      }
    }

    if (test.errors) {
      test.errors.forEach(function(e) {
        e.candidates.splice(e.candidates.indexOf(test), 1);
      });
      delete test.errors;
    }

    // TODO check progress of test

    // remove it from the list of tests that have been started
    suite.started.splice(suite.started.indexOf(test), 1);

    // clean up properties that are no longer needed
    delete test.obj;
    delete test.func;
    delete test.startTime;

    suite.results.push(test);
    if (options.onTestDone) {
      // notify listener
      options.onTestDone(test);
    }

    // if we have no more tests to start and none still running, we're done
    if (suite.todo.length == 0 && suite.started.length == 0) {
      suiteFinished();
    }

    process.nextTick(function() {
     // check to see if we can isolate any errors
     checkErrors();

     startNextTest();
    });
  }

  // listens for uncaught errors and keeps track of which tests they could be from
  function errorHandler(err) {
    // assertions throw an error, but we can't just catch those errors, because
    // then the rest of the test will run.  So, we don't catch it and it ends up
    // here. When that happens just finish the test.
    if (err instanceof assert.AssertionError && err.TEST) {
      var t = err.TEST;
      delete err.TEST;
      testFinished(t, err);
      return;
    }

    // We want to allow tests to supply a function for handling uncaught errors,
    // and since all uncaught errors come here, this is where we have to handle
    // them.
    // (you can only handle uncaught errors when not in parallel mode)
    if (!options.parallel && suite.started[0].UEHandler) {
      // an error could possibly be thrown in the UncaughtExceptionHandler, in
      // this case we do not want to call the handler again, so we move it
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

    var summary =
      { error: err
      , candidates: suite.started.slice()
      , endTime: new Date()
      };
    summary.candidates.forEach(function(t) {
      // add this error to the list of errors a test is a candidate for
      if (t.errors) {
        t.errors.push(summary);
      }
      else {
        t.errors = [summary];
      }
    });

    suite.errored.push(summary);

    // check to see if we can isolate any errors
    checkErrors();
  }

  function checkErrors() {
    // any time a test finishes, we could learn more about errors that had
    // multiple candidates, so loop through and see if anything has changed
    for(var i = 0; i < suite.errored.length; i++) {
      var err = suite.errored[i];

      // if there is only one candidate then we can finish that test
      if (suite.errored[i].candidates.length == 1) {
        suite.errored.splice(i,1);
        i = 0;

        var test = err.candidates[0];

        test.duration = err.endTime - test.startTime;
        delete err.endTime;

        testFinished(test, err.error);
      }
    }

    // if the number of errors we've found equals the number of tests still
    // running then we know that the errors must match up with the tests, so 
    // finish each of the tests.
    if (suite.errored.length && suite.errored.length == suite.started.length) {
      suite.started.slice().forEach(function(t) {
        testFinished(t, t.errors.map(function(d) { return d.error; }));
      });

      suite.errored = [];
    }
  }

  function exitHandler() {
    if (suite.started.length > 0) {
      if (options.onPrematureExit) {
        options.onPrematureExit(suite.started.map(function(t) { return t.name; }));
      }
    }
  }

  // clean up method which notifies all listeners of what happened
  function suiteFinished() {
    process.removeListener('uncaughtException', errorHandler);
    process.removeListener('exit', exitHandler);

    if (options.onSuiteDone) {
      var result =
        { name: options.name
        , duration: new Date() - suite.startTime
        , tests: suite.results
        , numFailures: 0
        , numSuccesses: 0
        };


      suite.results.forEach(function(r) {
        result[r.failure ? 'numFailures' : 'numSuccesses']++;
      });

      options.onSuiteDone(result);
    }
  }
}

/* runFiles runs an array, where each element in the array can be a file name or
 * a directory name module.
 *
 * Available configuration options:
 *
 * + parallel:  boolean, for whether or not the tests should be run in parallel
 *              or serially.  Obviously, parallel is faster, but it doesn't give
 *              as accurate error reporting
 * + testName:  string or array of strings, the name(s) of a test to be ran
 * + suiteName: string or array of strings, the name(s) of a suite to be ran
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
// It gets an absolute path for each file (original file names might be relative)
// returns an array of file objects which look like:
// { name: 'the passed in path'
// , path: 'the absolute path to the file with the extension removed (for requiring)'
// , index: index in the array, later on this is useful for when passing around
//          suites
// }
exports.expandFiles = function(list, suiteNames, cb) {
  if (typeof cb === 'undefined') {
    cb = suiteNames;
    suiteNames = null;
  }

  if (list.constructor != Array) {
    list = [list];
  }
  if (suiteNames && suiteNames.constructor != Array) {
    suiteNames = [suiteNames];
  }
  if (suiteNames && suiteNames.length === 0) {
    suiteNames = null;
  }

  list.sort();

  var suites = []
    , explicit = []
    ;

  for(var i = 0; i < list.length; i++) {
    explicit.push(list[i]);
  }

  processNextItem();

  function foundSuite(suite) {
    if (suites.some(function(el) { return el.path == suite.path })) {
      // we've already added this file
      return;
    }
    if (suiteNames && suiteNames.indexOf(suite.name) < 0) {
      // this file doesn't match the specified suiteNames
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
            console.log('No such file or directory: '+file);
            console.log('');
            processNextItem();
            return;
          }
          else {
            throw err;
          }
        }

        if (stat.isFile()) {
          // if they explicitly requested this file make sure to grab it
          // regardless of its name, otherwise when recursing into directories
          // only grab files that start with "test-" and end with ".js"
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
                // don't look at hidden files of directores
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

// store the assertion functions available to tests
var assertionFunctions = {};

// this allows people to add custom assertion functions.
//
// An assertion function needs to throw an error that is `instanceof
// assert.AssertionError` so it is possible to distinguish between runtime
// errors and failures. I recommend the `assert.fail` method.
exports.registerAssertion = function(name, func) {
  assertionFunctions[name] = func;
}

// register the default functions
var assertionModuleAssertions = [ 'ok', 'equal', 'notEqual', 'deepEqual', 'notDeepEqual', 'strictEqual', 'notStrictEqual', 'throws', 'doesNotThrow', 'ifError'];
assertionModuleAssertions.forEach(function(funcName) {
    exports.registerAssertion(funcName, assert[funcName]);
  });

// used when tests are ran, adds the assertion functions to a test object, but
// binds them to that particular test so assertions are properly associated with
// the right test.
function addAssertionFunctions(test) {
  for (var funcName in assertionFunctions) {
    (function() {
      var fn = funcName;
      test.obj[fn] = function() {
        try {
          assertionFunctions[fn].apply(null, arguments);
          test.numAssertions++;
        }
        catch(err) {
          if (err instanceof assert.AssertionError) {
            err.TEST = test;
          }
          throw err;
        }
      }
    })();
  };
}

// this is a recursive function because suites can hold sub suites
exports.getTestsFromObject = function(o, filter, namespace) {
  var tests = [];
  for(var key in o) {
    var displayName = (namespace ? namespace+' \u2192 ' : '') + key;
    if (typeof o[key] == 'function') {
      // if the testName option is set, then only add the test to the todo
      // list if the name matches
      if (!filter || filter.indexOf(key) >= 0) {
        tests.push({name: displayName , func: o[key]});
      }
    }
    else {
      tests = tests.concat(exports.getTestsFromObject(o[key], filter, displayName));
    }
  }

  return tests;
}
