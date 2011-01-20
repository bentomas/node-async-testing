if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

module.exports = {
  'test interference': function(test) {
    test.finish()
    require('util').print('interference')
  }
}
