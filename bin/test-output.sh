extras=$@

group() {
  echo $1
  echo "=============================================================================================="
}
run() {
  echo $ "$@" $extras
  "$@" $extras
  echo "----------------------------------------------------------------------------------------------"
}

echo ""

group "mixed multiple"
run node test/test-sync_assertions.js test/test-all_passing.js -0 
run node test/test-sync_assertions.js test/test-all_passing.js -1 
run node test/test-sync_assertions.js test/test-all_passing.js -2

group "make sure log level flag works"
run node test/test-sync_assertions.js test/test-all_passing.js --log-level 0

group "make sure '--all' works with each output level"
run node test/test-sync_assertions.js test/test-all_passing.js -0 --all 
run node test/test-sync_assertions.js test/test-all_passing.js -1 --all 
run node test/test-sync_assertions.js test/test-all_passing.js -2 --all

group "make sure you can do no color"
run node test/test-sync_assertions.js test/test-all_passing.js --no-color

group "all passing, one suite"
run node test/test-all_passing.js -0 
run node test/test-all_passing.js -1

group "all passing, multiple suites"
run node test/test-all_passing.js test/test-overview.js -0 
run node test/test-all_passing.js test/test-overview.js -1

group "failures, one suite"
run node test/test-sync_assertions.js -0 
run node test/test-sync_assertions.js -1

group "failures, multiple suites"
run node test/test-sync_assertions.js test/test-async_assertions.js -0 
run node test/test-sync_assertions.js test/test-async_assertions.js -1

group "test errors, one suite"
run node test/test-error_sync.js -0 
run node test/test-error_sync.js -1 

group "test errors, multiple suites"
run node test/test-error_sync.js test/test-error_async.js -0 
run node test/test-error_sync.js test/test-error_async.js -1 

group "test multiple errors, in parallel"
run node test/test-error_async.js -0 -p 
run node test/test-error_async.js -1 -p 

group "test load error, one suite"
run node test/test-error_outside_suite.js -0 
run node test/test-error_outside_suite.js -1 
run node test/test-error_outside_suite.js -2

group "test load error, multiple suites"
run node test/test-error_outside_suite.js test/test-error_syntax.js -0 
run node test/test-error_outside_suite.js test/test-error_syntax.js -1 
run node test/test-error_outside_suite.js test/test-error_syntax.js -2

group "--test-name"
run node test/test-all_passing.js --all --test-name "test A" --test-name "test B"
run node test/test-all_passing.js test/test-sync_assertions.js --all --test-name "test A" --test-name "test fail"

group "--suite-name"
run node test/test-all_passing.js test/test-sync_assertions.js test/test-async_assertions.js --suite-name "test/test-all_passing.js" --all
run node test/test-all_passing.js test/test-sync_assertions.js test/test-async_assertions.js --suite-name "test/test-all_passing.js" --suite-name "test/test-sync_assertions.js" --all
