module: async_testing
=====================


## method: runSuite (testSuite,opts)

`testSuite` is a test module for example `runSuite (require('./test/simpleTest'),opts)`
each property in the object should be a test. A test is just a method which takes one argument `(test)` 
and then make assertions by calling `test.ok(true)` etc. and eventually `test.finish()`
making an assertion after `test.finish()` or calling `test.finish()` twice results in a 
testAlreadyFinished error. not calling `test.finish()` at all is a an error as well. (see onSuiteDone({'0','exit',...)

 Available configuration options:
 *
+ parallel: boolean, for whether or not the tests should be run in parallel or serially.  Obviously, parallel is faster, but it doesn't give as accurate error reporting
+testName: string or array of strings, the name of a test to be ran
+name:     string, the name of the suite being ran
+ onTestStart
+ onTestDone
+ onSuiteDone

example:

<pre>
      { name: 'string'
      , testName: [array of test names to run]
      , onTestStart: function (test) {}
      , onTestDone: function (status,test) {}
      , onSuiteDone: function (status,report) {}
      }
</pre>

###callback arguments: onSuiteDone (status,report)

status may be:

+ _complete_ : valid result, success or failure
+ _exit_ : some tests did not call `test.finish()`
+ _loadError_ : an error occured while loading the test, i.e. a syntax error
+ _error_ : the test threw an error. 

currently the report differs for each status

+ complete 

<pre>
    {tests: //list of tests
      [
        { name: [name of test]
        , numAssertions: [number of Assertions in test]
        , failure: [error which caused failure] // only if this test failed, or errored.
        , failureType: ['assertion' or 'error']
        }
      ]
    }
</pre>

+ exit [list of tests which did not finish]
+ loadError [error message (string)]
+ error 

<pre>
    { err: errorObject
    , tests: [list of names of tests which where running when err error occured]
    }
    //usually an error is caught by the test and it's registered as a failure.
    //sometimes a test throws an error asyncronously, and async_testing doesn't 
    //know which test it came from.
</pre>

###callback arguments: onTestStart (test)

+ test: name of the test which has started.

###callback arguments: onTestDone (status,test)
+ status : 'success', or 'failure'
+ report:

<pre>
    { name: [name of test]
    , numAssertions: [number of Assertions in test]
    , failure: [error which caused failure] // only if this test failed, or errored.
    , failureType: ['assertion' or 'error']
    }
</pre>


## method: runFile (modulepath,opts)
module is the path to the test suite to run. run a test in a child process, opts and callbacks are same as for runSuite.





