if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

module.exports = {
 'test throw null': function(test) {
    throw null;
  }
, 'test throw undefined': function(test) {
    throw undefined;
  }
, 'test throw boolean': function(test) {
    throw false;
  }
, 'test throw number': function(test) {
    throw 0;
  }
, 'test throw String': function(test) {
    throw 'hello';
  }
/*, 'test throw error without stack': function(test) {
    //weird but it happens some times... stackoverflow, for example.
    var e = new Error ("THIS ERROR HAS NO STACK TRACE")
    delete e.stack
    throw e   
  }*/
, 'test stack overflow': function(test) {
    //weird but it happens some times... stackoverflow, for example.
    function overflow(){
      overflow()
    }
    overflow()
  }
}
