
exports['test sync error'] = function(test) {
  throw new Error();
};
exports['test async error'] = function(test) {
  setTimeout(function() {
      throw new Error();
    }, 500);
};

if (module == require.main) {
  require('../async_testing').run(exports, process.ARGV);
}
