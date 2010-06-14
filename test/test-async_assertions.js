
exports['test success'] = function(assert, finished) {
  setTimeout(function() {
      assert.ok(true, 'This should be true');
      finished();
    }, 500);
};
exports['test fail'] = function(assert, finished) {
  setTimeout(function() {
      assert.ok(false, 'This should be false');
      finished();
    }, 500);
};
exports['test success -- numAssertionsExpected'] = function(assert, finished) {
  this.numAssertionsExpected = 1;
  setTimeout(function() {
      assert.ok(true, 'This should be true');
      finished();
    }, 500);
};
exports['test fail -- numAssertionsExpected'] = function(assert, finished) {
  this.numAssertionsExpected = 1;
  setTimeout(function() {
      assert.ok(false, 'This should be false');
      finished();
    }, 500);
};
exports['test fail - not enough -- numAssertionsExpected'] = function(assert, finished) {
  this.numAssertionsExpected = 1;
  setTimeout(function() {
      finished();
    }, 500);
};
exports['test fail - too many -- numAssertionsExpected'] = function(assert, finished) {
  this.numAssertionsExpected = 1;
  setTimeout(function() {
      assert.ok(true, 'This should be true');
      assert.ok(true, 'This should be true');
      finished();
    }, 500);
};

if (module == require.main) {
  require('../async_testing').run(exports, process.ARGV);
}
