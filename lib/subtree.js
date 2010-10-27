//subtree
var assert = require('assert');

function assert_subtree(little,big,message,chain){
	message = message || "";

	//check that every property in little is also in big.
		chain = chain || [];
		if('object' === typeof little) {
			for (var k in little) {
				t = assert_subtree(little[k],big[k],message,chain.concat([k]))	
			}
		} else {
			assert.notEqual(big,undefined, message 
				+ "\nexpected results to contain " 
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
exports.assert_subtree = assert_subtree


exports.subtree =	function subtree(little,big){
		try {
			assert_subtree(little,big);
			return true;
		} catch (err){
			console.log('error');
			if (err instanceof AssertionError) {
				return false;
			} else { throw err };
		}
	}
