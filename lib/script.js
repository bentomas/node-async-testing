//script (runs async test as a script, with nothing clever, incase async_testing is causing errors)

assert = require('assert')

if (module == require.main) {
  process.ARGV.shift()
  process.ARGV.shift()
  console.log(process.ARGV)
  process.ARGV.forEach(runFile)
}

exports.runFile = runFile
function runFile(file){
 test = require(/*process.ENV.PWD + '/' +*/ file)
  console.log()
  console.log()
  console.log("running test suite:   " + file)
 
 tests = Object.keys(test)
 function next (i){
    
  if (i >= tests.length){
    console.log()
    console.log("all tests completed!")//since an error should exit.
    return
  }
  
  assert.finish = function (){
    next(i + 1)
  }
  
  console.log()
  console.log("  running test:   " + tests[i])
  
  test[tests[i]](assert)
 }
 
 next(0)

}

