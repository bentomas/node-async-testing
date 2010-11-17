
if (module == require.main) {
  require('async_testing').run(__filename, process.ARGV);
}

  var expected = require('./examples/expected_results')

//var MetaTest = require('meta_test')
, subtree = require('async_testing/lib/subtree')
, inspect = require('util').inspect
, asynct = require('async_testing')

function runTest (test,filename,expected){
//  var m = MetaTest()
  
//  m.run(filename,{onSuiteDone: suiteDone})
      console.log("test started: " + filename)
    asynct.runFile(filename,{onSuiteDone: suiteDone})
  
  function suiteDone(status,report){
      console.log("...test done: " + filename)
      subtree.assert_subtree(expected,report)
      test.finish();
  }
}


  for (i in expected.expected){
    (function (j){
      exports[j] = function (test){
       // var tests = expected.expected[j].tests.map(function (e){return e.name})
        runTest(test,'async_testing/test/examples/' + j,expected.expected[j])
      }
    console.log(j)
    })(i)
  }



