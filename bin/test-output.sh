
group() {
  echo $1
  echo "=============================================================================================="
}
run() {
  for cmd in "$@"
  do
    echo "$cmd\n"
    $cmd
    echo "\n----------------------------------------------------------------------------------------------"
  done
}

group "mixed multiple"
run "node test/test-sync_assertions.js test/test-all_passing.js -0" \
    "node test/test-sync_assertions.js test/test-all_passing.js -1" \
    "node test/test-sync_assertions.js test/test-all_passing.js -2"

group "make sure log level flag works"
run "node test/test-sync_assertions.js test/test-all_passing.js --log-level 0"

group "make sure '--all' works with each output level"
run "node test/test-sync_assertions.js test/test-all_passing.js -0 --all" \
    "node test/test-sync_assertions.js test/test-all_passing.js -1 --all" \
    "node test/test-sync_assertions.js test/test-all_passing.js -2 --all"

group "make sure you can do no color"
run "node test/test-sync_assertions.js test/test-all_passing.js --no-color"

group "all passing, one suite"
run "node test/test-all_passing.js -0" \
    "node test/test-all_passing.js -1"

group "all passing, multiple suites"
run "node test/test-all_passing.js test/test-readme.js -0" \
    "node test/test-all_passing.js test/test-readme.js -1"

group "some failing, one suite"
run "node test/test-sync_assertions.js -0" \
    "node test/test-sync_assertions.js -1"

group "some failing, multiple suites"
run "node test/test-sync_assertions.js test/test-async_assertions.js -0" \
    "node test/test-sync_assertions.js test/test-async_assertions.js -1"
