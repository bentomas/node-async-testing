

//check that runSuite callbacks are executed in order.
  var expected = require('./examples/expected_results')
    , subtree = require('async_testing/lib/subtree')
//    , asynct = require('async_testing')
    , asynct = require('async_testing/lib/child_http')

//var testing = require('async_testing/lib/testing')
  , inspect = require('util').inspect
  
  
function checkCallbacks (test, filename,expected){
  var tests = tests
    , started = []
    , finished = []

  console.log()
  console.log("***" + filename)

  var tests = expected.tests.map(function (e){return e.name})
  var reports = {}
    expected.tests.forEach(function (e){
      reports[e.name] = e    
    })
    
  asynct.runFile(filename,{onTestStart:testStart,onTestDone:testDone,onSuiteDone:suiteDone})

  function testStart(testName){
    console.log("  testStarted: " + testName)
    
    test.ok(testName,'testName must be non null')
    test.ok(tests.indexOf(testName) !== -1, 'test \'' + testName + '\' must be in list of tests: ' + inspect (tests))
    test.ok(started.indexOf(testName) === -1, 'test hasn\'t already started')
    test.ok(finished.indexOf(testName) === -1, 'test hasn\'t already finished')
    
    started.push(testName)
  }
  function testDone(status,report){
    var testName = report.name
    
    console.log("  ...testDone: " + report.name + " -> " + status)
    test.ok(testName,'testName must be non null')
    test.ok(tests.indexOf(testName) !== -1, 'test = ' + testName + ' must be in list of tests' + inspect (tests))
    test.ok(started.indexOf(testName) !== -1, 'finished test must have already started')
    test.ok(finished.indexOf(testName) === -1, 'test hasn\'t already finished')
    
      subtree.assert_subtree(reports[testName],report)
    
    started.splice(started.indexOf(testName),1)
    finished.push(testName)
  }
  function suiteDone(status,report){
    test.deepEqual(started,[],"onTestStart called for all tests, started tests where :" + inspect(started))
    test.deepEqual(finished.sort(),tests.sort(),"onTestDone called for all tests")
    
    subtree.assert_subtree(expected,report)

  console.log("***" + filename + " DONE")

  console.log()

    test.finish()
  }
}

//generate tests.
  for (i in expected.expected){
    (function (j){
      exports[j] = function (test){
       // var tests = expected.expected[j].tests.map(function (e){return e.name})
        checkCallbacks(test,'async_testing/test/examples/' + j,expected.expected[j])
      }
    console.log(j)
    })(i)
  }
