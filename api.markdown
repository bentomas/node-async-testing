The events that are called by `testing.runSuites` and/or `testing.runSuite`.
These make it possible to write your own test runners and format the output
however you like.

Events
------
onStart: function(numSuites)
onDone: function(suiteResultsArray, duration)

onSuiteStart: function([suiteName])  // carefull! suite name might not exist
onSuiteDone: function(suiteResult)

onTestStart: function(testName)  // carefull!  errors caused here will show up in the suite errors
onTestDone: function(testResult)  // carefull!  errors caused here will show up in the suite errors

onPrematureExit: function(testNamesArray)

Objects
-------
testResult: (one of the following)
  multiError:
    { name: [testName1, testName2, testName3]
    , status: 'multiError'
    , errors: [err1, err2, err3]
    }
  failure:
    { duration: how long the test took
    , name: test name
    , status: 'failure'
    , failure: the assertion error
    }
  error:
    { duration: how long the test took
    , name: test name
    , status: 'error'
    , error: the error
    }
  success:
    { duration: how long the test took
    , name: test name
    , status: 'success'
    , numAssertions: number of assertions
    }

suiteResult:
  { name: suite name (if applicable)
  , results: [testResult1, testResult2, ...]
  , duration: how long the suite took
  , numErrors: number of errors
  , numFailures: number of failures
  , numSuccesses: number of successes
  }
