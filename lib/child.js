
//this module SHOULD NOT be required as a library, it will interfere.
//must be used in a spawned process.
if (module !== require.main) {
  return
}

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
  console.log("\n" + testing.messageEncode.apply(null, arguments)); //hack for interference problem. just prepend a newline.
  //means that output is a few newlines, and never completely clean :( but behaves better.
}

function makeErrorJsonable(err) {
  var r = new RegExp(process.cwd(),'g')
  return {
      message: err.message || null
    , stack: err.stack ? err.stack.replace(r, '.') : '[no stack trace]'
    }
}
