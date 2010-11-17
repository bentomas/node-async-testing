var subtree = require("async_testing/lib/subtree")
,	sys = require('util');


function  sb (test,little,big,bool) {
	var bool = bool === undefined ? true : false
	, m = bool ? 'doesNotThrow' : 'throws';
	/*sys.puts("bool " + bool);
	sys.puts("little " + sys.inspect(little));
	sys.puts("big " + sys.inspect(big));*/
	
	test[m](function(){subtree.assert_subtree(little,big)});
	test.ok(bool === subtree.subtree(little,big),"expected: subtree of " + sys.inspect(big) + " but got " + sys.inspect(little));
//	subtree.subtree
}
exports.test_subtree = function (test) {
	var little = {a: "a",b:"b"}
	,	big = {a: "a",b:"b",c:"c"}
	,	little2 = {a: "a",b:"b",d:'DEE'}
	sb(test,little,big);
	sb(test,little,little2);
//	test.ok(subtree.subtree(little,little2),"expected: subtree of " + sys.inspect(big) + " but got " + sys.inspect(little));
//	test.ok(!subtree.subtree(little2,big),"expected: subtree of " + sys.inspect(big) + " but got " + sys.inspect(little));

	test.finish();
}

exports.test_subtree_errors = function (test) {
	var little = {a: "a",b:"b"}
	,	big = {a: "a",b:"b",c:"c"}
	,	little2 = {a: "a",b:"b",d:'DEE'}
//	sb(test,big,little);
	subtree.assert_subtree(little,big);
  test.throws(function(){
  	subtree.assert_subtree(big,little);
	});
	test.finish();
}

exports.test_subtree_object = function (test) {
	var little = {a: "a",b:"b",d:{}}
	  ,	big = {a: "a",b:"b",c:"c",d:{hi: "hello"}}
	  , big2 = {a: "a",b:"b"}
	subtree.assert_subtree(little,big);
  test.throws(function(){
  	subtree.assert_subtree(little,big2);
	});
	test.finish();
}


if (module == require.main) {
  require('async_testing').run(__filename, process.ARGV);
}



	
