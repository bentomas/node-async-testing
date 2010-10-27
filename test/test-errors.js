
module.exports = {
  'test sync error': function(test) {
    throw new Error();
  },

  'test async error': function(test) {
    setTimeout(function() {
        throw new Error();
      }, 500);
  }
};

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
/*  require('../lib/async_testing').runSuite(__filename,{
	  	 onSuiteDone:
		 	function(report){
	  			var sys = require('sys')
	  			sys.puts(sys.inspect(report))
		 	}
		}
	);**/
}
