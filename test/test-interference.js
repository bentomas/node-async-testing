if (module == require.main) {
  return require('async_testing').run(process.ARGV);
}

require('../lib/child')

exports ['test should fail'] = function (test){
    test.ok(false)
}

/*
this test will be reported to pass, when clearly it should fail.
*/
