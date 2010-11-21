//async_testing.runfile.asynct


exports ['does not call onSuiteDone twice'] = function (test){

  var file = 'async_testing/test/examples/test-stderr'
  require('async_testing').runFile(file,{onSuiteDone:suiteDone})

  function suiteDone (status,report){
    console.log("suiteDone - " + status + "'" + file + "'")
    console.log(report.stderr)
    test.finish()
  }
}

/*
  if there isn't a second test, this process will exit before suiteError is called again.

*/

exports ['does not call onSuiteDone twice2'] = function (test){
  require('async_testing').runFile('async_testing/test/examples/test-all_passing',{onSuiteDone:suiteDone})

  function suiteDone (status,report){
    test.finish()
  }
}
