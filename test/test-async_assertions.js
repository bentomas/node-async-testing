
exports['test success'] = function(test) {
  setTimeout(function() {
      test.ok(true, 'This should be true');
      test.finished();
    }, 500);
};
exports['test fail'] = function(test) {
  setTimeout(function() {
      test.ok(false, 'This should be false');
      test.finished();
    }, 500);
};
exports['test success -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  setTimeout(function() {
      test.ok(true, 'This should be true');
      test.finished();
    }, 500);
};
exports['test fail -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  setTimeout(function() {
      test.ok(false, 'This should be false');
      test.finished();
    }, 500);
};
exports['test fail - not enough -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  setTimeout(function() {
      test.finished();
    }, 500);
};
exports['test fail - too many -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  setTimeout(function() {
      test.ok(true, 'This should be true');
      test.ok(true, 'This should be true');
      test.finished();
    }, 500);
};

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
