The events that are called by `testing.runFiles` and/or `testing.runSuite` make
it possible to write your own test runners and format the output however you'd
like.  See `lib/console-runner.js` or `lib/web-runner.js` for examples of how
all these functions work.

Events
------
+ `onStart`: called when `runFiles` starts running suites.  This gets 1 argument:
  the number of suites being ran.

+ `onDone`: called when `runFiles` finishes running the suites.  This gets 2
  arguments: an array of suite results (see below), and the duration in seconds
  that it took to run all the suites.

+ `onSuiteStart`: called when a suite is started.  This gets 1 optional argument:
  the name of the suite.  A suite might not have name.

+ `onSuiteDone`: called when a suite finishes. This gets 1 argument: the suite
  result object for the specific suite. See below.

+ `onTestStart`: called when a test is started. This gets 1 argument: the name of
  the test.

  Carefull! The test runner will think errors thrown in this function belong to
  the test suite and you'll get inaccurate results.  Basically, make sure you
  don't throw any errors in this listener.

+ `onTestDone`: Called when a test finishes. This gets 1 argument, the test
  result object for the specific test.  See below.

  Carefull! The test runner will think errors thrown in this function belong to
  the test suite and you'll get inaccurate results.  Basically, make sure you
  don't throw any errors in this listener.

+ `onPrematureExit`: called when the process exits and there are still tests that
  haven't finished. This occurs when people forget to finish their tests or their
  tests don't work like they expected.  This gets 1 argument: an array of the
  names of the tests that haven't finished.

Suite Result
------------
A suite result is an object that looks like this:

    { name: suite name (if applicable)
    , results: an array of test results for each test ran (see below)
    , duration: how long the suite took
    , numFailures: number of failures
    , numSuccesses: number of successes
    }

Note: even if a suite has many tests, the array of tests results might not have
them all if a specific test was requested.  So a Suite Result could have the
results of 0 tests.

Test Result
-----------
A test result is an object that looks like one of the following:

success: the test completed successfully

    { duration: how long the test took
    , name: test name
    , numAssertions: number of assertions
    }

failure: the test failed in some way

    { duration: how long the test took
    , name: test name
    , failure: the error or array of error candidates
    }

If the tests are running in parallel and an error is thrown, sometimes it cannot 
reliably be determined which test went with which error.  If that is the case
then the 'failure' will be an array of all the errors that could have gone with
this test.
