if (module == require.main) {
  return require('async_testing').run(process.ARGV);
}

var child = require('async_testing/lib/child2')
  , inspect = require('inspect')

exports ['can run a simple test'] = function(test){

  child.runFile('async_testing/test/examples/test-all_passing',{onSuiteDone: suiteDone})

  function suiteDone(status,report){
  console.log("ERROR:")
  console.log(inspect(report))
    test.equal(status,'complete')
    
  //  tset.equal(report.test == 'complete')
    test.finish()
  }

}

exports ['can make callbacks into message and back'] = function(test){

  var message = 'asdfhasdflsdlf'
  var masterCallbacks = {
    send: function(m){
      test.equal(m,message)
      test.finish()
    }
  }

  mm = child.makeMessage(masterCallbacks)
  
  cb = child.makeCallbacks(mm,recieve)
  cb.send(message)
  function recieve(message){
    child.parseMessage(message,masterCallbacks)
  }
}

/*exports ['ignores noise'] = function(test){
    child.parseMessage(message,test.ifError)
}*/

exports ['accepts test adapter'] = function (test){
  var calls = [/*'onSuiteStart',*/'onTestStart','onTestDone','onSuiteDone','onExit']
  var callbacks = { adapter: "async_testing/test/lib/dummy_test_adapter" }
  
  calls.forEach(each)
  
  function each(fName){
    callbacks[fName] = function (status,data){
      thisCall = calls.shift()
      console.log("dummy test adapter called: " + thisCall + " expected:" + fName)
      test.equal(thisCall,fName)
      test.equal(status,fName)
      test.deepEqual(data , {test: "dummy_test_adapter: " + fName, object: {magicNumber: 123471947194 } } )
      
      if (calls.length == 0) {
        test.finish()
      }
    }
  }

  child = require('async_testing/lib/child2')
  child.runFile("async_testing/test/lib/magic_number" ,callbacks)
}

exports ['calls onSuiteDone(\'loadError\') if child did not exit properly.'
            + ' example: syntax error'] = function (test) {
            
  var callbacks = 
      { adapter: "async_testing/test/lib/dummy_test_adapter" 
      , onSuiteDone: done }
      
  function done(loadError,data){
    console.log(data)
    test.equal(loadError,'loadError')
    test.finish()
  }
            
  child = require('async_testing/lib/child2')
  child.runFile("async_testing/test/examples/test-error_syntax" ,callbacks)
}


exports ['calls onSuiteDone(\'loadError\') does not confuse stderr with real loadError.'] = function (test) {

  var callbacks = 
      { adapter: "async_testing/test/lib/dummy_test_adapter" 
      , onSuiteDone: done }
      
  function done(onSuiteDone,data){
    console.log(data)
    test.equal(onSuiteDone,'onSuiteDone')
    process.nextTick(test.finish)
  }

  child = require('async_testing/lib/child2')
  child.runFile("async_testing/test/lib/stderr" ,callbacks)
}










