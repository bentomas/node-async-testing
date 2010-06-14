
exports['test success'] = function(assert) {
  assert.ok(true, 'This should be true');
};
exports['test fail'] = function(assert) {
  assert.ok(false, 'This should be false');
};
exports['test success -- numAssertionsExpected'] = function(assert) {
  this.numAssertionsExpected = 1;
  assert.ok(true, 'This should be true');
};
exports['test fail -- numAssertionsExpected'] = function(assert) {
  this.numAssertionsExpected = 1;
  assert.ok(false);
};
exports['test fail - not enough -- numAssertionsExpected'] = function(assert) {
  this.numAssertionsExpected = 1;
};
exports['test fail - too many -- numAssertionsExpected'] = function(assert) {
  this.numAssertionsExpected = 1;
  assert.ok(true, 'This should be true');
  assert.ok(true, 'This should be true');
};

if (module == require.main) {
  require('../async_testing').run(exports, process.ARGV);
}
