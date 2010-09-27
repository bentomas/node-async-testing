#! /usr/bin/env node

console.log('node-async-test command is deprecated.\nSee http://github.com/bentomas/node-async-testing for how to run tests\n');

try {
  // always check for a local copy of async_testing first
  var testing = require('../lib/async_testing');
}
catch(err) {
  if( err.message == "Cannot find module './async_testing'" ) {
    // look in the path for async_testing
    var testing = require('async_testing');
  }
  else {
    throw err;
  }
}

testing.run(null, process.ARGV, done);

function done(allResults) {
  // we want to have our exit status be the number of problems

  var problems = 0;

  for(var i = 0; i < allResults.length; i++) {
    if (allResults[i].tests.length > 0) {
      problems += allResults[i].numErrors;
      problems += allResults[i].numFailures;
    }
  }

  process.exit(problems);
}
