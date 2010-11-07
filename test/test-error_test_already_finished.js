if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

module.exports = {
  'test sync already finished': function(test) {
    test.finish();
    test.finish();
  },
}
