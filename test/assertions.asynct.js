var inspect = require('util').inspect
, EventEmitter = require('events').EventEmitter
var truthy = [true,1]
, falsey = [0,'',[]]
, ok = [true,1,2,100,-1,"true",{},[],new Error()]
, notOk = [false,0,null,undefined,""]

exports['ok'] = function(test){

  ok.forEach(function (t){
    test.ok(t, "expected " + t + " to evaluate to true" )
  });

  notOk.forEach(function (t){
    test.ok(!t, "expected " + t + " to !evaluate to true" )
  });
  test.finish();
}

exports['throws doesNotThrow'] = function (test){
  var throwable = [new Error('throw me'),"thrown",7,null,undefined,[],{}]
  
  throwable.forEach(function (t) {
    test.throws(function(){
      throw t
    });
  });
  throwable.forEach(function (t) {
    test.doesNotThrow(function(){
      return t
    });
  });
  throwable.forEach(function (t) {
    test.throws(function(){
      process.emit('error', t)
    });
  });
  test.finish()
}

function comparison(test,method,a,b) {
  test[method](a,b,"expected : " + method + "( " + inspect(a) + " ,  " + inspect(b) + " );")
}
exports['equals deepEquals strictEquals'] = function (test){
  var c1 = [1,2,3]
  , c2 = [1,2,3]
  
    c1.push(c1);
    c2.push(c2);
    c3 = [1,2,3,c1]
  /*
    put a bunch of example comparisons in a hash by method name, 
    then iterate and apply the method  
  */
  var comparisons = {
  equal: [
      [1,1]
    , [2,2]
    , [2,2.0]
    , ['hello',"hello"]
    , ['36',36]
    , ['36.0',36]
    , ['3.6e1',36]
    , ['.36e2',36]
    , [null,undefined]
    , [c1,c1]
    , [Array,Array]
    , [true,1] // 'truthy' values
    , [false,0]//falsey
    , [false,'']
    , [false,[]]
    ]
  , notEqual: [
      [1,0]
    , ['hello',"Hello"]
    , [[],[]]
    , [{},{}]
    , [c1,c2]
    , [c1,c3]
    , [function(){},function(){}]
    , [function(){},'function(){}']
    , [true,2]
    , [true,'true']
    , [false,null]
    , [false,undefined]    
    , [false,'false']
    , [false,true]
    , [false,{}]
    ]
  , strictEqual: [
      [1,1]
    , ['hello','hello']
    , [c1,c1]
    , [Array,Array]
    , [true,true]
    , [false,false]
    , [test,test]
    ]
  , notStrictEqual: [
      [1,'1']
    , [null,undefined]
    , [true,1]  // 'truthy' values
    , [false,0] // falsey
    , [false,'']
    , [false,[]]
    , [new EventEmitter(),new EventEmitter()]//not stict equal unless same object
    ]
  , deepEqual: [
    , [[],[]]
    , [{},{}]
    , [[1,2,3],[1,2,3]]
    , [[1,2,3],['1','2.0','.3e1']]
    , [{hello:'hi',goodbye:'bye'},{hello:'hi',goodbye:'bye'}]
    , [[1,2,3,{}],[1,2,3,{}]]
    , [c1,c1]
  //, [c1,c2] // this causes stackoverflow.
    , [c1,c3] //but this passes, since c1[3] === c1 and c3[3] === c1
    , [[1,2,3,[],4],[1,2,3,[],4]]
    , [[1,2,3,{},4],[1,2,3,{},4]]
    , [[1,[2,3],[],4],[1,[2,3],[],4]]
    , [new EventEmitter(),new EventEmitter()]//most new objects of same type should be equal
    ]
  , notDeepEqual: [
    , [new Error(),new Error()]//when a error is created it stack trace gets set, and the message will differ by column number somewhere.
  ]
  }  

  for (method in comparisons) {
    comparisons[method].forEach(function(e){
      comparison(test,method,e[0],e[1])   
    });
  }
  test.finish();
}
/*
  I've noticed that async_testing does not seem to report isError throws 
  correctly, make a meta test to fix this.

  also, test should have an errorListener method which registers an error but 
  doesn't throw... &  errorListenerThrows, incase thats useful too.
*/

exports['ifError'] = function (test){
  //ifError is inverse of ok, but takes no message.
 notOk.forEach(function (e){
    test.ifError(e)
  });
 ok.forEach(function (e){
    test.throws(function(){
      test.ifError(e)
    });
  });
  test.finish();
}
