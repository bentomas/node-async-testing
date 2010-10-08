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
    , onPrematureExit: prematureExit
    , onTestStart: testStart
    , onTestDone: testDone
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
    if (result.failure.length) {
      result.status = 'error';
      result.failure = result.failure.map(function(el) {
        var index = multiErrors.indexOf(el);
        if (index < 0) {
          index = multiErrors.length;
          multiErrors.push(el);
        }
        return {
            message: el.message
          , index: index
          , stack: el.stack.replace(stackReplaceRegExp, '.')
          };
      });
    }
    else {
      result.status = result.failure instanceof assert.AssertionError ? 'failure' : 'error';
      result.failure =
        { message: result.failure.message
        , stack: result.failure.stack.replace(stackReplaceRegExp, '.')
        };
    }
  }
  else {
    result.status = 'success';
  }

  postMessage({cmd: 'testDone', result: result});
}
function prematureExit(tests) {
  if (closed) { return; }

  postMessage({cmd: 'prematureExit', tests: tests});
}
