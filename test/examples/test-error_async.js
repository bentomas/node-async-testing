if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

module.exports =
  { 'test passes': function(test) {
      setTimeout(function() {
          test.ok(true);
          test.finish();
        }, 500);
    }

  , 'test async error 1': function(test) {
      setTimeout(function() {
          throw new Error('error 1');
        }, 500);
    }

  , 'test async error 2': function(test) {
      setTimeout(function() {
          throw new Error('error 2');
        }, 500);
    }

  , 'test async error 3': function(test) {
      setTimeout(function() {
          throw new Error('error 3');
        }, 500);
    }
}
