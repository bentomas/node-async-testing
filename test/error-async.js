
module.exports = {
  'test async error 1': function(test) {
    setTimeout(function() {
        throw new Error('error 1');
      }, 500);
  },

  'test async error 2': function(test) {
    setTimeout(function() {
        throw new Error('error 2');
      }, 500);
  }
}

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
