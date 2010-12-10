
exports['test sync error'] = function(test) {
  throw new Error();
};

exports['test async error'] = function(test) {
  setTimeout(function() {
      throw new Error();
    }, 500);
};

exports['test a thrown non-Error object'] = function(test) {
  throw "a string, not an error";
}

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
