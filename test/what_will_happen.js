

//var origExit = process.exit;

//console.log(require('util').inspect(process,true))

/*
process.exit = function (x){
    console.log("about to exit")
    process.emit('exit')
      process.nextTick(function (){
        console.log("REALLY ExITING")
      origExit(x)
//    process.ReallyExit(x)
  })
}
*/

var orig = process.emit;
process.emit = function(event){
    if (event === 'exit') {
        //report();
        console.log(arguments)
    }
    orig.apply(this, arguments);
};

process.on('uncaughtException',function (err){

  console.log("uncaughtException")
  console.log(err)
//  throw err
})

process.on('exit',function (){

  console.log("EXITING")
})


//process.nextTick(function (){throw new Error()})

//process.emit('error',new Error("sdhfklashgklsdgl"))

//require('./examples/test-error_syntax')
//process.exit()
