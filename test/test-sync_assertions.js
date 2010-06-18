
exports['test success'] = function(test) {
  test.ok(true, 'This should be true');
  test.finished();
};
exports['test fail'] = function(test) {
  test.ok(false, 'This should be false');
  test.finished();
};
exports['test success -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  test.ok(true, 'This should be true');
  test.finished();
};
exports['test fail -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  test.ok(false);
  test.finished();
};
exports['test fail - not enough -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  test.finished();
};
exports['test fail - too many -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  test.ok(true, 'This should be true');
  test.ok(true, 'This should be true');
  test.finished();
};

if (module == require.main) {
  require('../async_testing').run(exports, process.ARGV);
}
