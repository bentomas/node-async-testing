var assert = require('assert')
  , path = require('path')
  ;

exports.name = 'Console';

exports.runnerFlag =
  { description: 'use the console runner for running tests from a terminal'
  , longFlag: 'console'
  , key: 'runner'
  , value: 'Console'
  , shortFlag: 'c'
  };

exports.optionsFlags = 
  [ { longFlag: 'log-level'
    , shortFlag: 'l'
    , key: 'verbosity'
    , description: '0 => succinct, 1 => default, 2 => full stack traces'
    , takesValue: 'level'
    }
  , { shortFlag: '0'
    , key: 'verbosity'
    , value: 0
    , description: 'set log level to 0'
    }
  , { shortFlag: '1'
    , key: 'verbosity'
    , value: 1
    , description: 'set log level to 1'
    }
  , { shortFlag: '2'
    , key: 'verbosity'
    , value: 2
    , description: 'set log level to 2'
    }
  , { longFlag: 'all'
    , shortFlag: 'a'
    , key: 'printSuccesses'
    , description: 'don\'t supress information about passing tests'
    }
  , { longFlag: 'no-color'
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

  if (!('verbosity' in options)) {
    options.verbosity = 1;
  }

  // clean up and parse options
  if (options.noColor) {
    red = green = yellow = function(str) { return str; };
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
      { parallel: options.testsParallel
      , testName: options.testName
      , onTestDone: function(status, result) {
          testFinished(suite, status, result);
        }
      , onSuiteDone: function(status, results) {
          suiteFinished(suite, status, results);
        }
      }

    suite.startTime = new Date();
    testing.runFile(suite.path, opts);

    if (options.suitesParallel) {
      startNextSuite();
    }
  }

  // we want to output the suite results in the order they were given to us,
  // so as suties finish we buffer them, and then output them in the right
  // order when we can
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
          output.suiteDone(suites[i]);
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

  function testFinished(suite, status, result) {
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
          var color = result.failureType == 'assertion' ? red : yellow;
          console.log(color('  ✖ ' + result.name));
        }
        else if (options.printSuccesses) {
          console.log('  ✔ ' + result.name);
        }
      }
    , suiteDone: function(suite) {
        output['suite'+suite.status.substr(0,1).toUpperCase()+suite.status.substr(1)](suite);
      }
    , suiteLoadError: function(suite) {
        var err = suite.results.stderr;

        if (!suite.printedName) {
          console.log(bold(suite.name));
        }

        console.log(yellow('  ' + bold('!') + ' Error loading suite'));

        if (options.verbosity > 0) {
          console.log('');

          var lines = err.split('\n');

          var num = options.verbosity == 1 ? Math.min(6, lines.length) : lines.length;
          for (var i = 0; i < num; i++) {
            console.log('  ' + lines[i]);
          }
        }

        console.log('');
      }
    , suiteComplete: function(suite) {
        var suiteResults = suite.results;
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
              var s = r.failure.stack.split("\n");

              console.log(r.failureType == 'assertion' ? '  Failure: '+red(r.name) : '  Error: '+yellow(r.name));

              if (r.failure.message) {
                console.log('    '+ r.failure.message);
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
            if (suites.length > 1) {
              last += ' FAILURES: '+suiteResults.numFailures+'/'+total+' tests failed.';
            }
          }
          else if (suites.length > 1) {
            last += '  '+green('OK: ')+total+' test'+(total == 1 ? '' : 's')+'. '+totalAssertions+' assertion'+(totalAssertions == 1 ? '' : 's')+'.';
          }
        }

        if (options.verbosity == 0) {
          if (options.printSuccesses || suiteResults.numFailures > 0) {
            console.log('');
          }
        }
        else if(last.length && suites.length > 1) {
          console.log(last + ' ' + (suite.duration/1000) + ' seconds.');
          console.log('');
        }
      }
    , suiteError: function(suite) {
        var err = suite.results.error;
        var tests = suite.results.tests;

        if (!suite.printedName && suite.name) {
          console.log(bold(suite.name));
        }

        var names = tests.slice(0, tests.length-1).map(function(name) { return yellow(name); }).join(', ') + 
                    (tests.length > 1 ? ' or ' : '') +
                    yellow(tests[tests.length-1]);

        console.log(yellow('  ✖ ') + names);

        if (options.verbosity > 0) {
          console.log('');

          if (tests.length > 1) {
            console.log('  Stopped Running suite! Cannot determine which test threw error: ');
            console.log('  ' + names);
          }
          else {
            console.log('  Error: ' + yellow(tests[0]));
          }

          var s = err.stack.split("\n");
          if (err.message) {
            console.log('    '+err.message);
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
        }

        console.log('');
      }
    , suiteExit: function(suite) {
        // TODO: test me
        var tests = suite.results.tests;

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
        var passingSuites = 0
          , totalSuites = 0
          , totalTests = 0
          , passingTests = 0
          ;

        for(var i = 0; i < suites.length; i++) {
          totalSuites++;
          if (suites[i].status == 'complete' && suites[i].results.numFailures == 0) {
            passingSuites++;
          }

          if ('numSuccesses' in suites[i].results) {
            totalTests += suites[i].results.numSuccesses + suites[i].results.numFailures;
            passingTests += suites[i].results.numSuccesses;
          }
          else {
            totalTests += NaN;
          }
        }

        var last = '';
        if (passingSuites != totalSuites) {
          last += red('PROBLEMS:');
          last += ' '+(totalSuites-passingSuites)+'/'+totalSuites+' suites had problems.';
        }
        else {
          last += green('SUCCESS:');
          last += ' '+totalSuites+' suite' + (totalSuites == 1 ? '' : 's') + '.';
        }

        if (isNaN(totalTests)) {
          last += ' Could not count tests.';
        }
        else if (passingTests != totalTests) {
          last += ' ' + (totalTests-passingTests)+'/'+totalTests+' tests' + ' failed.';
        }
        else {
          last += ' ' + totalTests + ' test' + (totalTests == 1 ? '' : 's') + '.';
        }

        console.log(bold(last + ' ' + ((new Date() - startTime)/1000) + ' seconds.'));

        if (callback) {
          var allResults = suites.map(function(s) {
            return {
                name: s.name
              , status: s.status
              , results: s.results
              };
          });
          callback(allResults);
        }
      }
    }
}
