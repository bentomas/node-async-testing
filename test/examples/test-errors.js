
exports['test sync error'] = function(test) {
  throw new Error();
};

exports['test async error'] = function(test) {
  process.nextTick(function() {
      throw new Error();
    });
};

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
