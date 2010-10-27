var testing = require('./testing')
  , stackReplaceRegExp = new RegExp(process.cwd(),'g')
  , frame = '~m~'
  ;

var opts =
  { name: JSON.parse(process.ARGV[3])
  , parallel: JSON.parse(process.ARGV[4])
  , testName: JSON.parse(process.ARGV[5])
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

try {
  var s = require(process.ARGV[2]);
}
catch(err) {
  postMessage('onRequireError', {message: err.message, stack: err.stack});
  return;
}

testing.runSuite(s, opts);

// this encode function inspired by socket.io's
function postMessage() {
  var r = '';
  for (var i = 0; i < arguments.length; i++) {
    var json = JSON.stringify(arguments[i]);
    r += frame + json.length + frame + json;
  }

  console.log(r);
}

function makeErrorJsonable(err) {
  return  { message: err.message ? err.message : null
          , stack: err.stack.replace(stackReplaceRegExp, '.')
          };
}
