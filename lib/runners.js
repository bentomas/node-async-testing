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

  // make sure options exist
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

  // list needs to be an array
  if (!list) {
    list = [];
  }
  else if (list.constructor != Array) {
    // if it isn't an array, a module was passed in directly to be ran
    list = [list];
  }

  for(var i = 2; i < args.length; i++) {
    switch(args[i]) {
      case "--log":
      case "-l":
        options.verbosity = args[i+1];
        i++;
        break;
      case "--parallel":
      case "-p":
        options.parallel = true;
        break;
      case "--consecutive":
      case "-c":
        options.parallel = false;
        break;
      case "--test-name":
      case "-t":
        options.testName = args[i+1];
        i++;
        break;
      case "--suite-name":
      case "-n":
        options.suiteName = args[i+1];
        i++;
        break;
      case "--help":
      case "-h":
        options.help = true;
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
    sys.puts('Flags:');
    sys.puts('  --log, -l: the log level: 0 => succinct, 1 => default, 2 => full stack traces');
    sys.puts('  --test-name, -t: to search for a specific test');
    sys.puts('  --suite-name, -s: to search for a specific suite ');
    sys.puts('  --parallel, -p: run the suites in parallel mode');
    sys.puts('  --consecutive, -c: don\'t run the suites in parallel mode');
    sys.puts('  --help, -h: this help message');
    process.exit();
  }

  if (typeof options.verbosity == 'undefined') {
    options.verbosity = 1;
  }
  if (typeof options.parallel == 'undefined') {
    options.parallel = false;
  }

  /* Available options (aside from those available to runSuites in async_testing.js
   *
   * verbosity: 0, 1, or 2
   *  0 Not much
   *  2 All
   *  1 Somewhere in the middle
   */

  opts =
    { parallel: options.parallel
    , testName: options.testName
    , suiteName: options.suiteName
    , onSuiteStart: function(name) {
        if (name) {
          sys.puts(bold(name));
        }
        else {
          sys.puts('');
        }
      }
    , onSuiteDone: function(suiteResults) {
        var tests = suiteResults.tests;

        if (tests.length == 0) {
          return;
        }

        sys.puts('');
        if(options.verbosity > 0) {
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
            if (suiteResults.numErrors > 0) {
              sys.print(' ERRORS: '+suiteResults.numErrors+'/'+total+' tests errored.');
            }
          }
          else {
            sys.print('  '+green('OK: ')+total+' test'+(total == 1 ? '' : 's')+'.');
          }

          sys.puts(' '+(suiteResults.duration/1000)+' seconds.');
          sys.puts('');
        }
      }
    , onTestDone: function(result) {
        if (result.status == 'success') {
          sys.puts('  ✔ ' + result.name);
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

        if (total > 1) {
          if(successes != total) {
            sys.print(bold(red('PROBLEMS: ')+(total-successes)+'/'+total+' suites had problems.'));
          }
          else {
            sys.print(bold(green('SUCCESS: ')+total+'/'+total+' suites passed successfully.'));
          }
          sys.puts(bold(' ' + tests+(tests == 1 ? ' test' : ' total tests')+'. '+(duration/1000)+' seconds.'));
        }

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
