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
}
