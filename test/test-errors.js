
exports['test sync error'] = function(assert) {
  throw new Error();
};
exports['test async error'] = function(assert, finished) {
  setTimeout(function() {
      throw new Error();
    }, 500);
};

if (module == require.main) {
  require('../async_testing').run(exports, process.ARGV);
}
