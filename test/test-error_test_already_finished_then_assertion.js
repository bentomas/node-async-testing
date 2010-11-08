
if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}
module.exports = {
  'test sync already finished then assertion': function(test) {
    test.finish();
    test.ok(true,'this should fail');
  },
}
