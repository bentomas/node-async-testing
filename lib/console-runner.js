/* Console runner
 *
 * this is a mess right now, but it gets the job done!
 */

var assert = require('assert')
  , path = require('path')
  ;

exports.name = 'Console';

exports.runnerFlag =
  { description: 'run the tests and show the output in the terminal'
  , longFlag: 'console'
  , shortFlag: 'c'
  };

exports.optionsFlags = 
  [ { longFlag: 'log-level'
    , shortFlag: 'l'
    , description: '0 => succinct, 1 => default, 2 => full stack traces'
    , varName: 'level'
    }
  , { longFlag: null
    , shortFlag: '0'
    , description: 'set log level to 0'
    }
  , { longFlag: null
    , shortFlag: '1'
    , description: 'set log level to 1'
    }
  , { longFlag: null
    , shortFlag: '2'
    , description: 'set log level to 2'
    }
  , { longFlag: 'all'
    , shortFlag: 'a'
    , description: 'don\'t supress information about passing tests'
    }
  , { longFlag: 'no-color'
    , shortFlag: 'b'
    , description: 'don\'t use colored output'
    }
  ];

var testing = require('./async_testing');

/* The defualt test runner
 *
 * list: an array of filenames or modules to be run, or a commonjs module
 * options: options for running the suites
 * callback: a function to be called then the suites are finished
 */
exports.run = function(list, options, callback) {

  var red   = function(str){return "\033[31m" + str + "\033[39m"}
    , yellow   = function(str){return "\033[33m" + str + "\033[39m"}
    , green = function(str){return "\033[32m" + str + "\033[39m"}
    , bold  = function(str){return "\033[1m" + str + "\033[22m"}
    ;

  // clean up and parse options
  if ('0' in options) {
    options.verbosity = 0;
    delete options['0'];
  }
  if ('1' in options) {
    options.verbosity = 1;
    delete options['1'];
  }
  if ('2' in options) {
    options.verbosity = 2;
    delete options['2'];
  }
  if ('log-level' in options) {
    options.verbosity = options['log-level'][0];
    delete options['log-level'];
  }
  if (typeof options.verbosity == 'undefined') {
    options.verbosity = 1;
  }
  if (typeof options.parallel == 'undefined') {
    options.parallel = false;
  }
  if (options['no-color']) {
    red = green = yellow = function(str) { return str; };
    delete options['no-color'];
  }
  if (options.all) {
    options.printSuccesses = true;
    delete options.all;
  }

  var suites
    , startTime
    , index = 0
    , finishedIndex = 0
    , results = []
    ;

  testing.expandFiles(list, options.suiteName, startSuites);

  function startSuites(err, list) {
    if (err) {
      throw err;
    }
    suites = list;

    for (var i = 0; i < suites.length; i++) {
      suites[i].index = i;
      suites[i].printedName = false;
      suites[i].queuedTestResults = [];
    }

    startTime = new Date();
    startNextSuite();
  }
  function startNextSuite() {
    if (index >= suites.length) {
      // no more to start
      return;
    }

    var suite = suites[index];
    index++;

    var opts =
      { parallel: options.parallel
      , testName: options.testName
      , name: suite.name
      , onTestDone: function(result) {
          testFinished(suite, result);
        }
      , onSuiteCompleted: function(results) {
          suiteFinished(suite, 'suiteCompleted', Array.prototype.slice.call(arguments));
        }
      , onSuiteError: function(error, tests) {
          suiteFinished(suite, 'suiteErrored', Array.prototype.slice.call(arguments));
        }
      , onSuiteExit: function(tests) {
          suiteFinished(suite, 'suiteExited', Array.prototype.slice.call(arguments));
        }
      }

    suite.startTime = new Date();
    testing.runFile(suite.path, opts);

    startNextSuite();
  }

  function suiteFinished(suite, status, results) {
    suite.finished = true;
    suite.status = status;
    suite.duration = new Date() - suite.startTime;
    suite.results = results;
    delete suite.startTime;

    if (suite.index == finishedIndex) {

      for (var i = finishedIndex; i < suites.length; i++) {
        if (suites[i].finished) {
          while(suites[i].queuedTestResults.length) {
            output.testDone(suites[i], suites[i].queuedTestResults.shift());
          }
          output[suites[i].status](suites[i]);
        }
        else {
          break;
        }
      }
      finishedIndex = i;
    }

    if (finishedIndex >= suites.length) {
      output.allDone();
    }

    startNextSuite();
  }

  function testFinished(suite, result) {
    suite.queuedTestResults.push(result);
    if (suite.index == finishedIndex) {
      while(suite.queuedTestResults.length) {
        output.testDone(suite, suite.queuedTestResults.shift());
      }
    }
  }

  var output =
    { testDone: function(suite, result) {
        if (!suite.printedName) {
          if (options.printSuccesses || result.failure) {
            if (suite.name) {
              console.log(bold(suite.name));
            }
            suite.printedName = true;
          }
        }

        if (result.failure) {
          console.log(red('  ✖ ' + result.name));
        }
        else if (options.printSuccesses) {
          console.log('  ✔ ' + result.name);
        }
      }
    , suiteCompleted: function(suite) {
        var suiteResults = suite.results[0];
        var tests = suiteResults.tests;

        if (tests.length == 0) {
          return;
        }

        var last = '';
        if(options.verbosity > 0) {
          if (suites.length > 1 || suiteResults.numFailures > 0) {

            if (!suite.printedName) {
              console.log(bold(suite.name));
            }
          }

          if (options.printSuccesses || suiteResults.numFailures > 0) {
            console.log('');
          }

          var totalAssertions = 0;

          for(var i = 0; i < tests.length; i++) {
            var r = tests[i];
            if (r.failure) {
              console.log('  Failure: '+red(r.name));
              var s = r.failure.stack.split("\n");
              console.log('    '+ s[0].substr(16));
              if (options.verbosity == 1) {
                if (s.length > 1) {
                  console.log(s[1].replace(process.cwd(), '.'));
                }
                if (s.length > 2) {
                  console.log(s[2].replace(process.cwd(), '.'));
                }
              }
              else {
                for(var k = 1; k < s.length; k++) {
                  console.log(s[k].replace(process.cwd(), '.'));
                }
              }
            }
            else {
              totalAssertions += r.numAssertions;
            }
          }

          var total = suiteResults.numFailures+suiteResults.numSuccesses;

          if (suiteResults.numFailures > 0) {
            console.log('');
            last += ' ';
            if (suiteResults.numFailures > 0) {
              last += ' FAILURES: '+suiteResults.numFailures+'/'+total+' tests failed.';
            }
          }
          else if (options.verbosity > 0 && suites.length > 1) {
            last += '  '+green('OK: ')+total+' test'+(total == 1 ? '' : 's')+'. '+totalAssertions+' assertion'+(totalAssertions == 1 ? '' : 's')+'.';
          }
        }

        if (options.verbosity == 0) {
          if (options.printSuccesses || suiteResults.numFailures >0) {
            console.log('');
          }
        }
        else if(suiteResults.numFailures > 0 || suites.length > 1) {
          console.log(last + ' ' + (suite.duration/1000) + ' seconds.');
          console.log('');
        }
      }
    , suiteErrored: function(suite) {
        var err = suite.results[0];
        var tests = suite.results[1];

        if (!suite.printedName && suite.name) {
          console.log(bold(suite.name));
        }


        if (tests.length > 1) {
          console.log('  One of the following tests threw an error: ');
          console.log('  ' + tests.map(function(name) { return yellow(name); }).join(', '));
        }
        else {
          console.log('  Error: ' + yellow(tests[0]));
        }

        var s = err.stack.split("\n");
        if (err.message) {
          console.log('  '+err.message);
        }
        if (options.verbosity == 1) {
          if (s.length > 1) {
            console.log(s[1].replace(process.cwd(), '.'));
          }
          if (s.length > 2) {
            console.log(s[2].replace(process.cwd(), '.'));
          }
        }
        else {
          for(var k = 1; k < s.length; k++) {
            console.log(s[k]);
          }
        }

        console.log('');
      }
    , suiteExited: function(tests) {
        console.log('');
        console.log('Process exited.  The following test'+(tests.length == 1 ? '' : 's')+' never finished:');

        console.log('');
        for(var i = 0; i < tests.length; i++) {
          console.log('  + '+tests[i]);
        }
        console.log('');

        console.log('Did you forget to call test.finish()?');
      }
    , allDone: function() {
        var successes = 0;
        var total = 0;

        var allResults = suites.map(function(el) {
          return el.results;
        });

        for(var i = 0; i < suites.length; i++) {
          total++;
          switch(suites[i].status) {
            case 'suiteCompleted':
              if (suites[i].results[0].numFailures == 0) {
                successes++;
              }
              break;
          }
        }

        var last = '';
        if (successes != total) {
          last += bold(red('PROBLEMS:'));
          if (total > 1) {
            last += bold(' '+(total-successes)+'/'+total+' suites had problems.');
          }
        }
        else {
          last += bold(green('SUCCESS:'));
          if (total > 1) {
            last += bold(' '+total+'/'+total+' suites passed successfully.');
          }
        }
        console.log(last + ' ' + ((new Date() - startTime)/1000)+' seconds.');

        if (callback) {
          callback(total - successes);
        }
      }
    }
}
