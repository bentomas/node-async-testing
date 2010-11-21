
var child = require('async_testing/lib/child2')
  , inspect = require('inspect')
  , Tester = require('async_testing/lib/tester')
  , subtree = require('async_testing/lib/subtree')

//tester.script.asynct.js

/*
  OKAY! 
  refactor this to run in a child process...
  
  i've altered child2 so that you call it with a test adapter.

  NEXT: try loading tester as an adapter for child2.
*/


/*
exports ['can accept a file and return tests for that file'] = function (test){

  t = new Tester ('./examples/pass.script')
  test.deepEqual(t.tests,['pass.script'])
  test.finish()
}
*/
  /*
    am i gonna have to run all tests as a seperate process?
    that may be the most comprehensive solution...
    
    or design this to run around the test in the seperate process?
     - to ensure reporting is correct?
     - so child 2 is passed the test, then calls this, which calls the test.
     - child2 just handles communicating results.
     - this is the adapter to the test framework, & handles making reports
  */  
//  test.finish()
/*
exports ['can run a test'] = function (test){

  t = new Tester ('async_testing/test/examples/pass.script')
  test.deepEqual(t.tests,['pass.script'])
  
  t.run('pass.script',done)
  
  function done (status,data){
    var expected = 
          { test:'pass.script'
          , status: 'success'
          }
    test.equal(status,'success', "expected success:\n" + inspect(data))
    subtree.assert_subtree(expected,data)
    test.finish()  
  }
}


exports ['can run a failing test'] = function (test){

  var t = new Tester ('async_testing/test/examples/fail.script')
    , name = 'fail.script'
  test.deepEqual(t.tests,[name])
  
  t.run(name,done)
  
  function done (status,data){
    var expected = 
          { test:name
          , status: 'failure'
          , failureType: 'AssertionError' //actual type of error. will be string if a string is thrown.
          , failure: {}
          }
    test.equal(status,'failure', "expected 'failure', got:" + status + "\n" + inspect(data))
    subtree.assert_subtree(expected,data)
    test.finish()  
  }
}


exports ['can run an erroring test'] = function (test){

  var t = new Tester ('async_testing/test/examples/error.script')
    , name = 'error.script'
    , expectedStatus = 'error'

  test.deepEqual(t.tests,[name])
  
  t.run(name,done)
  
  function done (status,data){
    var expected = 
          { test:name
          , status: expectedStatus
          , failureType: 'Error' //actual type of error. will be string if a string is thrown.
          , failure: {} }

    test.equal(status,expectedStatus, "expected '" + expectedStatus + "', got:" + status + "\n" + inspect(data))
    subtree.assert_subtree(expected,data)
    test.finish()  
  }
}

exports ['can run an erroring test, non error thrown'] = function (test){

  var t = new Tester ('async_testing/test/examples/throw_string.script')
    , name = 'throw_string.script'
    , expectedStatus = 'error'

  test.deepEqual(t.tests,[name])

  t.run(name,done)

  function done (status,data){
    var expected = 
          { test:name
          , status: expectedStatus
          , failureType: 'string' //actual type of error. will be string if a string is thrown.
          , failure: "INTENSIONAL STRING THROW"
          }
    test.equal(status,expectedStatus, "expected '" + expectedStatus + "', got:" + status + "\n" + inspect(data))
    subtree.assert_subtree(expected,data)
    test.finish()  
  }
}
*/
exports ['can run an erroring test, async error'] = function (test){

/*
  to cleanly catch this sort of error, without interfering with THIS test frameworkm
  run this test in another process.
  
    -- or use a script test instead of an asynct test...
*/
  var cb = {adapter: "async_testing/lib/tester", onSuiteDone: done}

  child.runFile('async_testing/test/examples/async_error.script',cb)
//  var t = new Tester ()
    , name = 'async_error.script'
    , expectedStatus = 'error'

  function done (status,data){
    var expected = 
          { test:name
          , status: expectedStatus
          , failureType: 'string' //actual type of error. will be string if a string is thrown.
          , failure: "INTENSIONAL STRING THROW"
          }
    test.equal(status,expectedStatus, "expected '" + expectedStatus + "', got:" + status + "\n" + inspect(data))
//    subtree.assert_subtree(expected,data)

  //now that I have a good error reporting structure.
  //I can use it to define what the test results should be!

    test.finish()  
  }
}


