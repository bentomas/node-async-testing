var testing = require('./testing');

var opts =
  { parallel: JSON.parse(process.ARGV[3])
  , testName: JSON.parse(process.ARGV[4])
  , onTestStart: function testStart(name) {
      postMessage('onTestStart', name);
    }
  , onTestDone: function testDone(result) {
      if (result.failure) {
        result.failure = makeErrorJsonable(result.failure);
      }

      postMessage('onTestDone', result);
    }
  , onSuiteCompleted: function suiteDone(results) {
      postMessage('onSuiteCompleted', results);
    }
  , onSuiteError: function error(err, tests) {
      postMessage('onSuiteError', makeErrorJsonable(err), tests);
    }
  , onSuiteExit: function exit(tests) {
      postMessage('onSuiteExit', tests);
    }
  };

var s = require(process.ARGV[2]);

testing.runSuite(s, opts);

function postMessage() {
  console.log(testing.messageEncode.apply(null, arguments));
}

function makeErrorJsonable(err) {
  var r = new RegExp(process.cwd(),'g')

  return {
      message: err.message ? err.message : null
    , stack: err.stack.replace(r, '.')
    }
}
