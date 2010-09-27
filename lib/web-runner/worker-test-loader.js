var testing
  , path = require('path');

onmessage = function(message) {
  var details = message.data;

  // we have to load the testing module like this because web workers don't know
  // where they are so relative requires won't work.  We have our parent tell
  // us where we are
  if (!testing) {
    testing = require(path.join(details.dir, 'testing'));
  }

  var suite = require(details.module);
  var msg = {};

  var tests = testing.getTestsFromObject(suite);

  for (var i = 0; i < tests.length; i++) {
    msg[tests[i].name] = { func: ''+tests[i].func };
  }
  postMessage(msg);
}
