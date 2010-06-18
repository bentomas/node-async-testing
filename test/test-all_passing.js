
exports['test A'] = function(test) {
  test.ok(true);
  test.finished();
};
exports['test B'] = function(test) {
  test.ok(true);
  test.finished();
};
exports['test C'] = function(test) {
  test.ok(true);
  test.finished();
};
exports['test D'] = function(test) {
  test.ok(true);
  test.finished();
};

if (module == require.main) {
  require('../async_testing').run(exports, process.ARGV);
}
