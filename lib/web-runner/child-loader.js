var testing = require('../testing')
  , suite = require(process.ARGV[2])
  , tests = testing.getTestsFromObject(suite)
  , msg = {}
  ;

for (var i = 0; i < tests.length; i++) {
  msg[tests[i].name] = { func: ''+tests[i].func };
}

postMessage(msg);

function postMessage(str) {
  console.log(testing.messageEncode(str));
}
