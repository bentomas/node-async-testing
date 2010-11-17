
exports['test async error 1'] = function(test) {
  process.nextTick(function() {
      throw new Error();
    });
};

exports['test sync error'] = function(test) {
  throw new Error('Oooops');
};

exports['test async error 2'] = function(test) {
  process.nextTick(function() {
      throw new Error();
    });
};

exports['test async error 3'] = function(test) {
  process.nextTick(function() {
      throw new Error();
    });
};

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
