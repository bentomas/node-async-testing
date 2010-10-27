
module.exports = {
  'test sync error': function(test) {
    throw new Error();
  }
}

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
