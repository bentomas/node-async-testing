
files = ['test-all.js'
		,	'test-all_passing.js'
		,	'test-async_assertions.js'
		,	'test-custom_assertions.js'
		,	'test-errors.js'
		,	'test-multiple_errors.js'
		,	'test-sub_suites.js'
		,	'test-sync_assertions.js'
		,	'test-uncaught_exception_handlers.js'
		,	'test-wrap_tests.js']

if (module == require.main) {
  require('../lib/async_testing').run(files, process.ARGV);
}
