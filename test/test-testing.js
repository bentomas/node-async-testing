/**
* test-testing test node-async-testing with node-async-testing
*/
var at = require('../lib/async_testing')
,	sys = require('sys')
,	assert = require('assert')
,  subtree = require("../lib/subtree");

at.registerAssertion('subtree',subtree.assert_subtree);

/*	function subtree(little,big,message,chain){//check that every property in little is also in big.
		chain = chain || [];
		if('object' === typeof little) {
			for (var k in little) {
				t = subtree(little[k],big[k],message,chain.concat([k]))	
			}
		} else {
			assert.notEqual(big,undefined, message 
				+ "expected results to contain " 
				+ chain.join(".") 
				+ " but was undefined");
			assert.strictEqual(little,big, message
				+  "\nexpected " 
				+	chain.join(".") + " === " + little
				+	" (" + typeof big + ")"
				+	" but found: " + big
				+	" (" + typeof big + ")"
			);
		}
	}
*/
at.registerAssertion('subtree',subtree);
at.registerAssertion('strange',function(){assert,ok(false)});
exports['test runSuite'] = function (test) {
/*test.uncaughtExceptionHandler =function(error){
	test.ok(false,"uncaught error" + error);
}*/

	var e = {'test fail': 
			function (test) {
				test.ok(false,"fail");
				test.finish();		
			}
		,	'test pass': 
			function (test) {
				test.ok(true,"pass");
				test.finish();
			}
		}
	,	results = 
		{ tests://  Cannot read property 'UEHandler' of undefined...not very good error message.
			[	{	name:	'test fail'
				,	status: 'failure'
				,	failure: 
						{	message: 'fail'
						,	name: 'AssertionError'
						}			
				}
			,	{	name:	'test pass'
				,	status: 'success'
				}
			]
		}
	,	r = at.runSuite(e
		,	{	onSuiteDone: 
					function(report){
						sys.puts("report:");
						sys.puts(sys.inspect(report));
						sys.puts("expected:");
						sys.puts(sys.inspect(results));
						subtree.assert_subtree(results,report);
	
	
				/*
				//		test.subtree(results,report);
				this line is producing a wierd error
			    Cannot read property 'UEHandler' of undefined
   			 at errorHandler (/home/dominic/code/node/node-async-testing/lib/testing.js:209:46)
				I think this is to do with the fact I am testing a testing framework with it self.
				*/
						test.finish()
					}
			}
		);
	
	//test.pass();
}

/*
exports.runSuite
exports.runFiles
exports.expandFiles
exports.registerAssertion
exports.getTestsFromObject
*/

if (module == require.main) {
  require('async_testing').run(__filename, process.ARGV);
}

