
exports ['throw null makes test fail'] = function (test){
  //throw 'string'
  throw null
}

if(require.main === module){
  require('async_testing').run(process.argv)
  require('async_testing').runSuite(module.exports,{onSuiteDone: d})
  
  function d(status,report){
    console.log(status)
    console.log(report)
    /*
  complete
  { tests: 
   [ { name: 'throw null makes test fail',
       numAssertions: 0 } ],
  numFailures: 0,
  numSuccesses: 1 }
    */
  }
}


