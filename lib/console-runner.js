/* Console runner
 *
 * this is a mess right now, but it gets the job done!
 */

var assert = require('assert')
  , path = require('path')
  , sys = require('sys')
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

  // some state
  var currentSuite, printedCurrentSuite, numSuites, lastStart, start = new Date();

  opts =
    { parallel: options.parallel
    , testName: options.testName
    , suiteName: options.suiteName
    , onStart: function(num) {
        numSuites = num;
      }
    , onSuiteStart: function(name) {
        lastStart = new Date();
        currentSuite = name;
        printedCurrentSuite = false;
      }
    , onSuiteDone: function(suiteResults) {
        var tests = suiteResults.tests;

        if (tests.length == 0) {
          return;
        }

        if(options.verbosity > 0) {
          if (numSuites > 1 || suiteResults.numFailures > 0) {
            if (!printedCurrentSuite) {
              sys.puts(bold(currentSuite));
            }
          }

          if (options.printSuccesses || suiteResults.numFailures > 0) {
            sys.puts('');
          }

          var totalAssertions = 0;

          for(var i = 0; i < tests.length; i++) {
            var r = tests[i];
            if (r.failure) {
              sys.puts('  Failure: '+red(r.name));
              var s = r.failure.stack.split("\n");
              sys.puts('    '+ s[0].substr(16));
              if (options.verbosity == 1) {
                if (s.length > 1) {
                  sys.puts(s[1].replace(process.cwd(), '.'));
                }
                if (s.length > 2) {
                  sys.puts(s[2].replace(process.cwd(), '.'));
                }
              }
              else {
                for(var k = 1; k < s.length; k++) {
                  sys.puts(s[k].replace(process.cwd(), '.'));
                }
              }
            }
            else {
              totalAssertions += r.numAssertions;
            }
          }

          var total = suiteResults.numFailures+suiteResults.numSuccesses;

          if (suiteResults.numFailures > 0) {
            sys.puts('');
            sys.print(' ');
            if (suiteResults.numFailures > 0) {
              sys.print(' FAILURES: '+suiteResults.numFailures+'/'+total+' tests failed.');
            }
          }
          else if (options.verbosity > 0 && numSuites > 1) {
            sys.print('  '+green('OK: ')+total+' test'+(total == 1 ? '' : 's')+'. '+totalAssertions+' assertion'+(totalAssertions == 1 ? '' : 's')+'.');
          }
        }

        if (options.verbosity == 0) {
          if (options.printSuccesses || suiteResults.numFailures >0) {
            sys.puts('');
          }
        }
        else if(suiteResults.numFailures > 0 || numSuites > 1) {
          sys.puts(' '+((new Date() - lastStart)/1000)+' seconds.');
          sys.puts('');
        }
      }
    , onTestDone: function(result) {
        if (!printedCurrentSuite) {
          if (options.printSuccesses || result.failure) {
            if (currentSuite) {
              sys.puts(bold(currentSuite));
            }
            printedCurrentSuite = true;
          }
        }

        if (result.failure) {
          sys.puts(red('  ✖ ' + result.name));
        }
        else if (options.printSuccesses) {
          sys.puts('  ✔ ' + result.name);
        }
      }
    , onDone: function(allResults) {
        var successes = 0;
        var total = 0;
        var tests = 0;

        for(var i = 0; i < allResults.length; i++) {
          if (allResults[i].tests.length > 0) {
            total++;

            if (allResults[i].numFailures == 0) {
              successes++;
            }

            tests += allResults[i].numFailures;
            tests += allResults[i].numSuccesses;
          }
        }

        if (successes != total) {
          sys.print(bold(red('PROBLEMS:')));
          if (total > 1) {
            sys.print(bold(' '+(total-successes)+'/'+total+' suites had problems.'));
          }
        }
        else {
          sys.print(bold(green('SUCCESS:')));
          if (total > 1) {
            sys.print(bold(' '+total+'/'+total+' suites passed successfully.'));
          }
        }
        sys.puts(bold(' ' + tests+(tests == 1 ? ' test' : ' total tests')+'. '+((new Date() - start)/1000)+' seconds.'));

        if (callback) {
          callback(allResults);
        }
      }
    , onError: function(err, tests) {
        if (!printedCurrentSuite && currentSuite) {
          sys.puts(bold(currentSuite));
        }


        if (tests.length > 1) {
          sys.puts('  One of the following tests threw an error: ');
          sys.puts('  ' + tests.map(function(name) { return yellow(name); }).join(', '));
        }
        else {
          sys.puts('  Error: ' + yellow(tests[0]));
        }

        var s = err.stack.split("\n");
        if (err.message) {
          sys.puts('  '+err.message);
        }
        if (options.verbosity == 1) {
          if (s.length > 1) {
            sys.puts(s[1].replace(process.cwd(), '.'));
          }
          if (s.length > 2) {
            sys.puts(s[2].replace(process.cwd(), '.'));
          }
        }
        else {
          for(var k = 1; k < s.length; k++) {
            sys.puts(s[k]);
          }
        }
      }
    , onPrematureExit: function(tests) {
        sys.puts('');
        sys.puts('Process exited.  The following test'+(tests.length == 1 ? '' : 's')+' never finished:');

        sys.puts('');
        for(var i = 0; i < tests.length; i++) {
          sys.puts('  + '+tests[i]);
        }
        sys.puts('');

        sys.puts('Did you forget to call test.finish()?');
      }
    }

  testing.runFiles(list, opts);
}
