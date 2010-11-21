var path = require ('path')
  , assert = require('assert')
  , reports = require('./test_reports')



function Tester (filename){
  var dirname = path.dirname(filename)
  this.run = run

  function run(callbacks){


    var report = reports(filename)
    report.testNames = [report.name]
        
    callbacks.onSuiteStart && callbacks.onSuiteStart(report.name,report.suiteStart())
    callbacks.onTestStart && callbacks.onTestStart(report.name,report.testStart(report.name))

    function onError (error){
      console.log("ON ERROR!")
      var r = report.testDone(report.name)
      callbacks.onTestDone && callbacks.onTestDone(r.status,r)
    }
      
    process.on("uncaughtException",onError)

    try{
      require(filename)
    } catch (error) { //catch sync error
      return onError(error)
    }
/*    callback('success',
      { test:name
      , status: 'success' } )*/

    process.on('exit',function (code,status){
      console.log("ON EXIT: SUITE DONE!")
      console.log("ON EXIT()!" + !!callbacks.onExit)
      try{r = report.suiteDone()
        callbacks.onSuiteDone && callbacks.onSuiteDone(r.status,r)

        callbacks.onExit && callbacks.onExit(code,status)

      } catch (error){
        console.log(JSON.stringify(error))
        console.error(error.toString())
      }
    })

  }
}


exports = module.exports = Tester
module.exports.errorType = errorType
exports.runTest = function (file,callbacks){
  new Tester(file).run(callbacks)
}

function errorType(error){
  if('object' == typeof error){
    return error.name || error.constructor.name
  } else {
    return typeof error
  }
}
