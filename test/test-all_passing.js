var sys = require('sys')

module.exports = {
  'test A': function(test) {
    test.ok(true);
    test.finish();
  },

  'test B': function(test) {
    test.ok(true);
    test.finish();
  },

  'test C': function(test) {
    test.ok(true);
    test.finish();
  },

  'test D': function(test) {
    test.ok(true);
    test.finish();
  }
};

if (module == require.main) {
   //require('../lib/async_testing').run(__filename, process.ARGV);
   require('../lib/async_testing').runSuite(require(__filename),{
   	onSuiteDone:
   		function(report){sys.puts(sys.inspect(report));}
   });
}
