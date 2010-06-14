
exports['test A'] = function(assert) {
  assert.ok(true);
};
exports['test B'] = function(assert) {
  assert.ok(true);
};
exports['test C'] = function(assert) {
  assert.ok(true);
};
exports['test D'] = function(assert) {
  assert.ok(true);
};

if (module == require.main) {
  require('../async_testing').run(exports, process.ARGV);
}
