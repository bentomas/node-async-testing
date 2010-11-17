//child_http.asynct

var child = require('async_testing/lib/child_http')
  , expected = require('async_testing/test/examples/expected_results').expected
  , subtree = require('async_testing/lib/subtree')

exports ['start child as seperate process and run test'] = function (test){

  server = child.runFile('async_testing/test/examples/test-all_passing',{onSuiteDone: suiteDone})
  
  server.on('clientError', function (err){server.close(); throw err})
  
  function suiteDone(status,report){
    subtree.assert_subtree(expected['test-all_passing'],report)
    test.finish()      
  }
}

exports ['start child as seperate process and run test'] = function (test){

  server = child.runFile('async_testing/test/examples/test-all_passing',{onSuiteDone: suiteDone})
  
  function suiteDone(status,report){
    console.log(report)
    test.ok(status)
    test.ok(report,"expected non null report")
    subtree.assert_subtree(expected['test-all_passing'],report)
    test.finish()      
  }
}

exports ['set a timeout, if you think a test might hang'] = function (test){

  server = child.runFile('async_testing/test/examples/invalid/test-hang',{onSuiteDone: suiteDone, timeout: 200})//1 second
  
//  server.on('clientError', function (err){server.close(); throw err})
  
  function suiteDone(error,report){
    test.equal('timeoutError',error)

    test.ok(report.failure instanceof Error)

    test.finish()      
  }
}

exports ['what if server finishes, and then hangs'] = function (test){

  server = child.runFile('async_testing/test/examples/invalid/test-finish_then_hang',{onSuiteDone: suiteDone, timeout: 200})//1 second
  
//  server.on('clientError', function (err){server.close(); throw err})
  
  function suiteDone(error,report){
  //  test.ifError(error)
    test.equal('timeoutError',error)

    test.ok(report.failure instanceof Error)

    test.finish()      
  }
}


function runTest (test,filename,expected,status_expected){
  
  child.runFile(filename,{onSuiteDone: suiteDone})
  
  function suiteDone(status,report){
    console.log(status)
    console.log(report)
//      test.equal(status,status_expected)
      
      subtree.assert_subtree(expected,report)
      test.finish();
  } 
}
/*
exports['test-error_syntax'] = function(test){
  var expected = 
      { error: 
        {name: 'TestAlreadyFinishedError'}
      , tests: ['test sync already finished']
      }
    
  child.runFile('async_testing/test/examples/test-error_syntax' ,{onSuiteDone: suiteDone})
  
  function suiteDone(status,report){
      test.equal(status,'loadError')
      test.ok(report.stderr)
      
      test.finish();
  } 
}


exports['test-error_test_already_finished_async'] = function(test){
  var expect = 
      { error: 
        {name: 'TestAlreadyFinishedError'}
      , tests: ['test async already finished']
      }
    
  runTest(test,'async_testing/test/examples/test-error_test_already_finished_async',expect,'error')
}*/
/*exports['test-error_test_already_finished_then_assertion'] = function(test){
  var expect = 
      { error: 
        {name: 'TestAlreadyFinishedError'}
      , tests: ['test sync already finished then assertion']
      }
    
  runTest(test,__dirname + '/.async_testing_tests/test-error_test_already_finished_then_assertion',expect,'error')
}
*/
