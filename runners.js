var sys = require('sys')
  , path = require('path')
  ;

var testing = require('./async_testing');

var red   = function(str){return "\033[31m" + str + "\033[39m"}
  , yellow   = function(str){return "\033[33m" + str + "\033[39m"}
  , green = function(str){return "\033[32m" + str + "\033[39m"}
  , bold  = function(str){return "\033[1m" + str + "\033[22m"}
  ;

exports.def = function(list, options) {
  if (typeof options != 'undefined' && options && options.constructor == Array) {
    var args = options;
    options = {};

    if (!list) {
      list = [];
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
        case "--serial":
        case "-s":
          options.parallel = false;
          break;
        case "--test-name":
        case "-t":
          options.testName = args[i+1];
          i++;
          break;
        case "--suite-name":
        case "-n":
          options.suite = args[i+1];
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

    if( list.length < 1 ) {
      list = [process.cwd()];
    }
  }

  if (options.help) {
    sys.puts('Flags:');
    sys.puts('  --log, -l: the log level: 0, 1, 2');
    sys.puts('  --parallel, -p: run the suites in parallel mode');
    sys.puts('  --serial, -s: run the suites in serial mode');
    sys.puts('  --test-name, -t: to search for a specific test');
    sys.puts('  --suite-name, -n: to search for a specific suite ');
    sys.puts('  --help, -h: this help message');
    process.exit();
  }

  // make sure options exist
  options = options || {};

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
          sys.puts(bold(path.basename(name)));
        }
        else {
          sys.puts('');
        }
      }
    , onSuiteDone: function(name, results) {
        if (results.length == 0) {
          return;
        }

        sys.puts('');
        if( typeof options.verbose == 'undefined' || !options.verbose ) {
          var failures = 0;
          var errors = 0;
          var successes = 0;

          if(options.verbosity > 0) {
            for(var i = 0; i < results.length; i++) {
              var r = results[i];
              if (r.status == 'failure') {
                failures++;
                sys.puts('  Failure: '+red(r.name));
                var s = r.failure.stack.split("\n");
                sys.puts('    '+ s[0].substr(16));
                if (options.verbosity == 1) {
                  if (s.length > 1) {
                    sys.puts(s[1]);
                  }
                  if (s.length > 2) {
                    sys.puts(s[2]);
                  }
                }
                else {
                  for(var k = 1; k < s.length; k++) {
                    sys.puts(s[k]);
                  }
                }
              }           
              else if (r.status == 'error') {
                errors++;
                sys.puts('  Error: '+yellow(r.name));

                if (r.error.message) {
                  sys.puts('    '+r.error.message);
                }
                var s = r.error.stack.split("\n");
                if (options.verbosity == 1) {
                  if (s.length > 1) {
                    sys.puts(s[1]);
                  }
                  if (s.length > 2) {
                    sys.puts(s[2]);
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
                  errors++;
                  var s = r.errors[j].stack.split("\n");
                  sys.puts('  + '+s[0]);
                  if (options.verbosity == 1) {
                    if (s.length > 1) {
                      sys.puts(s[1]);
                    }
                    if (s.length > 2) {
                      sys.puts(s[2]);
                    }
                  }
                  else {
                    for(var k = 1; k < s.length; k++) {
                      sys.puts(s[k]);
                    }
                  }
                }
              }           
              else {
                successes++;
              }
            }

            var total = failures+successes+errors;

            if (failures + errors > 0) {
              sys.puts('');
              if (failures > 0) {
                sys.puts('  FAILURES: '+failures+'/'+total+' tests failed');
              }
              if (errors > 0) {
                sys.puts('  ERRORS: '+errors+'/'+total+' tests errored');
              }
            }
            else {
              sys.puts('  '+green('OK: ')+total+' tests');
            }
            sys.puts('');
          }
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
    , onDone: function(allResults) {
        var successes = 0;
        var total = 0;
        var tests = 0;

        for(var i = 0; i < allResults.length; i++) {
          if (allResults[i].results.length > 0) {
            total++;

            if (allResults[i].errors == 0 && allResults[i].failures == 0) {
              successes++;
            }

            tests += allResults[i].errors;
            tests += allResults[i].failures;
            tests += allResults[i].successes;
          }
        }

        if (total > 1) {
          if(successes != total) {
            sys.puts(bold(red('PROBLEMS: ')+(total-successes)+'/'+total+' suites had problems. '+tests+' total tests.'));
          }
          else {
            sys.puts(bold(green('SUCCESS: ')+total+'/'+total+' suites passed successfully. '+tests+' total tests.'));
          }
        }
      }
    }

  testing.runSuites(list, opts);
}
