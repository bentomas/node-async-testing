var testing
  , assert = require('assert')
  , path = require('path');

var started = false;

onmessage = function(message) {
  var details = message.data;

  // we have to load the testing module like this because web workers don't know
  // where they are so relative requires won't work.  We have our parent tell
  // us where we are
  if (!testing) {
    testing = require(path.join(details.dir, 'testing'));
  }

  var opts =
    { name: details.name
    , parallel: details.parallel
    , testName: details.testName
    , onSuiteStart: suiteStart
    , onSuiteDone: suiteDone
    , onTestStart: testStart
    , onTestDone: testDone
    , onError: error
    , onPrematureExit: prematureExit
    };

  try {
    var s = require(details.suite);
  }
  catch(err) {
    postMessage({cmd: 'suiteError', message: err.message, stack: err.stack});
    return;
  }

  started = true;
  testing.runSuite(s, opts);
  started = false;
}

onclose = function() {
  closed = true;
}

var closed = false;
var stackReplaceRegExp = new RegExp(process.cwd(),'g');
var multiErrors = [];

function suiteStart() {
  if (closed) { return; }

  // reset multiErrors
  multiErrors = [];

  postMessage({cmd: 'suiteStart'});
}
function suiteDone(results) {
  if (closed) { return; }

  postMessage({cmd: 'suiteDone', results: results});
}
function testStart(name) {
  if (closed) { return; }

  postMessage({cmd: 'testStart', name: name});
}
function testDone(result) {
  if (closed) { return; }

  if (result.failure) {
    result.failure =
      { message: result.failure.message ? result.failure.message : null
      , stack: result.failure.stack.replace(stackReplaceRegExp, '.')
      }
  }

  postMessage({cmd: 'testDone', result: result});
}
function error(err, tests) {
  if (closed) { return; }

  var e = { message: err.message ? err.message : null
          , stack: err.stack.replace(stackReplaceRegExp, '.')
          };

  postMessage({cmd: 'error', error: e, tests: tests});
}
function prematureExit(tests) {
  if (closed) { return; }

  postMessage({cmd: 'prematureExit', tests: tests});
}
