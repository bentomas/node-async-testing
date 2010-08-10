// a file for holding different built-in test runners.  It only has one right
// now.

var sys = require('sys')
  , path = require('path')
  ;

var testing = require('./async_testing');

/* The defualt test runner
 *
 * list: an array of filename or commonjs modules to be run, or a commonjs module
 * options: options for running the suites
 * args: command line arguments to override/augment the options
 * callback: a function to be called then the suites are finished
 */
exports.def = function(list, options, args, callback) {
  var red   = function(str){return "\033[31m" + str + "\033[39m"}
    , yellow   = function(str){return "\033[33m" + str + "\033[39m"}
    , green = function(str){return "\033[32m" + str + "\033[39m"}
    , bold  = function(str){return "\033[1m" + str + "\033[22m"}
    ;

  // make sure options exists
  if (typeof options == 'undefined' || options == null) {
    options = {};
  }

  if (typeof callback == 'undefined') {
    if (options.constructor == Array) {
      callback = args;
      args = options;
      options = {};
    }
    else {
      args = [];
    }
  }

  // create help message.  It uses the supplied options object to load the
  // defaults, so we have to make the help message here before we modify the
  // options object
  var helpMessage = createHelpMessage(options);

  // list needs to be an array
  if (!list) {
    list = [];
  }
  else if (list.constructor != Array) {
    // if it isn't an array, a module was passed in directly to be ran
    list = [list];
  }

  for(var i = 2; i < args.length; i++) {
    if (args[i].indexOf('-') == 0 && args[i].indexOf('--') != 0) {
      var flags = args[i].substr(1).split('');
      for(var j = 0; j < flags.length; j++) {
        flags[j] = '-'+flags[j];
      }
      args.splice.apply(args, [i, 1].concat(flags));
    }

    switch(args[i]) {
      case "--log-level":
      case "-l":
        options.verbosity = args[i+1];
        i++;
        break;
      case "-0":
        options.verbosity = 0;
        break;
      case "-1":
        options.verbosity = 1;
        break;
      case "-2":
        options.verbosity = 2;
        break;
      case "--parallel":
      case "-p":
        options.parallel = true;
        break;
      case "--serial":
      case "-P":
        options.parallel = false;
        break;
      case "--test-name":
      case "-t":
        options.testName = args[i+1];
        i++;
        break;
      case "--suite-name":
      case "-s":
        options.suiteName = args[i+1];
        i++;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--no-color":
      case "-w":
        options.noColor = true;
        break;
      case "--color":
      case "-W":
        options.noColor = false;
        break;
      case "--successes":
      case "-x":
        options.printSuccesses = true;
        break;
      case "--no-successes":
      case "-X":
        options.printSuccesses = false;
        break;
      default:
        list.push(args[i]);
    }
  }

  // if we have no items in this list, use the current dir
  if( list.length < 1 ) {
    list = ['.'];
  }

  // clean up list
  for(var i = 0; i < list.length; i++) {
    // if it is a filename and the filename starts with the current directory
    // then remove that so the results are more succinct
    if (typeof list[i] === 'string' && list[i].indexOf(process.cwd()) === 0 && list[i].length > (process.cwd().length+1)) {
      list[i] = list[i].replace(process.cwd()+'/', '');
    }
  }

  if (options.help) {
    sys.puts(helpMessage);
    return;
  }

  if (typeof options.verbosity == 'undefined') {
    options.verbosity = 1;
  }
  if (typeof options.parallel == 'undefined') {
    options.parallel = false;
  }

  if (options.noColor) {
    red = green = yellow = function(str) { return str; };
  }

  // some state
  var currentSuite = null
    , printedCurrentSuite = null
    , numSuites = null
    ;

  opts =
    { parallel: options.parallel
    , testName: options.testName
    , suiteName: options.suiteName
    , onStart: function(num) {
        numSuites = num;
      }
    , onSuiteStart: function(name) {
        currentSuite = name;
        printedCurrentSuite = false;
      }
    , onSuiteDone: function(suiteResults) {
        var tests = suiteResults.tests;

        if (tests.length == 0) {
          return;
        }

        if(options.verbosity > 0) {
          if (numSuites > 1 || suiteResults.numErrors > 0 || suiteResults.numFailures > 0) {
            if (!printedCurrentSuite) {
              sys.puts(bold(currentSuite));
            }
          }

          if (options.printSuccesses || suiteResults.numErrors > 0 || suiteResults.numFailures > 0) {
            sys.puts('');
          }

          for(var i = 0; i < tests.length; i++) {
            var r = tests[i];
            if (r.status == 'failure') {
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
                  sys.puts(s[k]);
                }
              }
            }
            else if (r.status == 'error') {
              sys.puts('  Error: '+yellow(r.name));

              if (r.error.message) {
                sys.puts('    '+r.error.message);
              }
              var s = r.error.stack.split("\n");
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
            else if (r.status == 'multiError') {
              sys.print('  Non-specific errors: ');
              for(var j = 0; j < r.name.length; j++) {
                if (j > 0) {
                  sys.print(', ');
                }
                sys.print(yellow(r.name[j]));
              }
              sys.puts('');
              for(var j = 0; j < r.errors.length; j++) {
                var s = r.errors[j].stack.split("\n");
                sys.puts('  + '+s[0]);
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
            }
          }

          var total = suiteResults.numFailures+suiteResults.numErrors+suiteResults.numSuccesses;

          if (suiteResults.numFailures + suiteResults.numErrors > 0) {
            sys.puts('');
            sys.print(' ');
            if (suiteResults.numFailures > 0) {
              sys.print(' FAILURES: '+suiteResults.numFailures+'/'+total+' tests failed.');
            }
            if (suiteResults.numFailures > 0 && suiteResults.numErrors > 0) {
              sys.puts('');
              sys.print(' ');
            }
            if (suiteResults.numErrors > 0) {
              sys.print(' ERRORS: '+suiteResults.numErrors+'/'+total+' tests errored.');
            }
          }
          else {
            if (options.verbosity > 0 && numSuites > 1) {
              sys.print('  '+green('OK: ')+total+' test'+(total == 1 ? '' : 's')+'.');
            }
          }

          if (suiteResults.numFailures > 0 && suiteResults.numErrors > 0) {
            sys.puts('');
            sys.print(' ');
          }
        }

        if (options.verbosity == 0) {
          if (options.printSuccesses || suiteResults.numErrors > 0 || suiteResults.numFailures >0) {
            sys.puts('');
          }
        }
        else if(suiteResults.numFailures > 0 || suiteResults.numErrors > 0 || numSuites > 1) {
          sys.puts(' '+(suiteResults.duration/1000)+' seconds.');
          sys.puts('');
        }
      }
    , onTestDone: function(result) {
        if (!printedCurrentSuite) {
          if (options.printSuccesses || result.status != 'success') {
            if (currentSuite) {
              sys.puts(bold(currentSuite));
            }
            printedCurrentSuite = true;
          }
        }

        if (result.status == 'success') {
          if (options.printSuccesses) {
            sys.puts('  ✔ ' + result.name);
          }
        }
        else if (result.status == 'failure') {
          sys.puts(red('  ✖ ' + result.name));
        }
        else if (result.status == 'error') {
          sys.puts(yellow('  ✖ ' + result.name))
        }
        else if (result.status == 'multiError') {
          for(var i = 0; i < result.name.length; i++) {
            sys.puts(yellow('  ✖ ' + result.name[i]));
          }
        }
      }
    , onDone: function(allResults, duration) {
        var successes = 0;
        var total = 0;
        var tests = 0;

        for(var i = 0; i < allResults.length; i++) {
          if (allResults[i].tests.length > 0) {
            total++;

            if (allResults[i].numErrors == 0 && allResults[i].numFailures == 0) {
              successes++;
            }

            tests += allResults[i].numErrors;
            tests += allResults[i].numFailures;
            tests += allResults[i].numSuccesses;
          }
        }

        if (successes != total) {
          sys.print(bold(red('PROBLEMS: ')+(total-successes)+'/'+total+' suites had problems.'));
        }
        else {
          sys.print(bold(green('SUCCESS:')));
          if (total > 1) {
            sys.print(bold(' '+total+'/'+total+' suites passed successfully.'));
          }
        }
        sys.puts(bold(' ' + tests+(tests == 1 ? ' test' : ' total tests')+'. '+(duration/1000)+' seconds.'));

        if (callback) {
          callback(allResults, duration);
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

  testing.runSuites(list, opts);
}

function createHelpMessage(options) {
  var helpMessage = 
      'Async-testing'
    + '\n-------------'
    + '\n'
    + '\nBehavior:'
    + '\n  --test-name,    -t <name>: only run tests with the specified name'
    + '\n'
    + '\n  --suite-name,   -s <name>: only run suites with the specified name'
    + '\n'
    + '\n  --serial,       -R: run the suites in serial mode'
    ;
  if (!options.parallel) {
    helpMessage += ' (default)';
  }

  helpMessage += '\n  --parallel,     -r: run the suites in parallel mode';
  if (options.parallel) {
    helpMessage += ' (default)';
  }

  helpMessage +=
      '\n'
    + '\n  --help,         -h: don\'t run and instead output this help message'
    + '\n'
    + '\nOutput:'
    + '\n  --log-level,    -l <level>: 0 => succinct, 1 => default, 2 => full stack traces'
    + '\n                  -0: set log level to 0'
    + '\n                  -1: set log level to 1'
    + '\n                  -2: set log level to 2'
    + '\n'
    + '\n  --no-successes, -X: supress output information about successes'
    ;
  if (!options.printSuccesses) {
    helpMessage += ' (default)';
  }

  helpMessage += '\n  --successes,    -x: output information about successes as they happen';
  if (options.printSuccesses) {
    helpMessage += ' (default)';
  }

  helpMessage += '\n\n  --color,        -W: use colored output';
  if (!options.noColor) {
    helpMessage += ' (default)';
  }

  helpMessage += '\n  --no-color,     -w: don\'t use colored output';
  if (options.parallel) {
    helpMessage += ' (default)';
  }

  helpMessage +=
    + '\n'
    + '\n'
    + '\nAny additional arguments will be interpreted as file names for test suites that'
    + '\nshould be ran.'
    ;

  return helpMessage;
}
