
exports['test async error 1'] = function(assert, finished) {
  process.nextTick(function() {
      throw new Error();
    });
};
exports['test sync error'] = function(assert, finished) {
  throw new Error('Oooops');
};
exports['test async error 2'] = function(assert, finished) {
  setTimeout(function() {
      throw new Error();
    }, 500);
};

if (module == require.main) {
  require('../async_testing').run(exports, process.ARGV);
}
