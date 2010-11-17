

console.log("when run async_testing.runFile child processes must exit")

var child_process = require('child_process')
  , assert = require('assert')
  , async_testing = require('async_testing')
  , inspect = require('util').inspect
  , initialNodes = []
  , tests = ['../test/test-all_passing','../test/test-overview','remap/test/modules.asynct']
function currentNodes(callback){
  child_process.exec('pidof node',[],pidOf)

  function pidOf (err,pids){
  var nodes = pids.split(/\s+/)

  assert.ifError(err)
  assert.equal(nodes.pop(),'',"TEST validity: expected the last item in nodes list to be ''")
  assert.ok(nodes.length >= 1, "TEST validity: expected at least one node process to be running, pids:" + inspect(nodes))
  
  callback(nodes)
  }
}


currentNodes(checkActiveNodeProcesses)


function checkActiveNodeProcesses (nodes){
  
  console.log("currently running node processes :" + inspect(nodes))
  initialNodes = nodes
  
  startAsyncTesting()
}

function startAsyncTesting(){
  var next = tests.shift()
  console.log(tests);
  if(!next){
    console.log("tests finished")
    process.exit(1)
//    checkNodesAreFinished()
  } else{
    
//    async_testing.runFile(next,{onSuiteDone: suiteDone, onTestDone: countRunningNodes})

    child_process.exec('asynct',[next],suiteDone)
    
    function suiteDone(status,report){
      console.log("test " + next + " finished as ;'" + status + "'")
//      console.log(report)
      
      startAsyncTesting()
    }
  }
}


function countRunningNodes (){
  console.log("count...")
}
