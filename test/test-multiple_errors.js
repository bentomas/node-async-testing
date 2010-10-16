
module.exports = {
  'test async error 1': function(test) {
    process.nextTick(function() {
        throw new Error();
      });
  },

  'test sync error': function(test) {
    throw new Error('Oooops');
  },

  'test async error 2': function(test) {
    setTimeout(function() {
        throw new Error();
      }, 500);
  },

  'test async error 3': function(test) {
    setTimeout(function() {
        throw new Error();
      }, 500);
  }
};

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
