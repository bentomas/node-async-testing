if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

module.exports = {
  'test async already finished': function(test) {
    test.finish();
    process.nextTick(function() {
      test.finish();
    });
  },
  'test another test': function(test) {
    test.finish();
  },
}
