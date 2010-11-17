
exports['not finished'] = function (test){
  test.finish()
  process.nextTick(function (){while(true){}})
}


