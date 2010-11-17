
if (module == require.main) {
  require('async_testing').run(__filename, process.ARGV);
}

  var expected = require('./examples/expected_results')

/*runTest = function (test,testName){
  var expected = expected[testName]
    , filename = expected[testName].file
    return runTest(test,filname,expected)
}*/

var MetaTest = require('meta_test')
, subtree = require('meta_test/subtree')
, inspect = require('util').inspect

function runTest (test,filename,expected){
  var m = MetaTest()
  
  m.run(filename,{onSuiteDone: suiteDone})
  
  function suiteDone(status,report){
//      console.log("test : " + inspect(test))
      console.log("expected: ")
      console.log(inspect(expected))
      console.log("report: ")
      console.log(inspect(report))
      subtree.assert_subtree(expected,report)
      test.finish();
  } 

}

  for (i in expected.expected){
    (function (j){
      exports[j] = function (test){
        runTest(test,'async_testing/test/examples/' + j,expected.expected[j])
      }
    console.log(j)
    })(i)
  }





