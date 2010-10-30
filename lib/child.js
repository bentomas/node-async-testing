var testing = require('./testing');

var opts =
  { parallel: JSON.parse(process.ARGV[3])
  , testName: JSON.parse(process.ARGV[4])
  , onTestStart: function testStart(name) {
      postMessage('onTestStart', name);
    }
  , onTestDone: function testDone(status, result) {
      if (result.failure) {
        result.failure = makeErrorJsonable(result.failure);
      }

      postMessage('onTestDone', status, result);
    }
  , onSuiteDone: function suiteDone(status, results) {
      postMessage('onSuiteDone', status, results);
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
