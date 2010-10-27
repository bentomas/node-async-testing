// holds the available runners
var runners = {};
// keeps track of the default
var defRunner;

/* Allow people to add their own runners
 *
 * A runner should export 4 things:
 *
 * name:          The name of the runner
 * run:           The run function
 * runnerFlag:    The options for the command line flag used to choose the runner
 * optionsFlags:  The options for the command line flags used to configure this runner
 *
 * See lib/console-runner.js or lib/web-runner.js for examples on what these
 * should look like
 */
exports.registerRunner = function(p, def) {
  var m = require(p);

  // TODO check to make sure we have everything we need

  runners[m.name] =
    { module: m
    , name: m.name
    , runnerFlag: m.runnerFlag
    , optionsFlags: m.optionsFlags
    , path: p
    };

  if (def) {
    defRunner = m.name;
  }
}

// add the built in runners
exports.registerRunner('./console-runner', true);
exports.registerRunner('./web-runner');

/* For running a bunch of tests suites and outputting results
 *
 * Takes 3 arguments:
 * list:      file or directory or array of files or directories
 * args:      array of command line arguments to change settings. this can also
 *            have file names in it that should be run
 * callback:  a callback for when it has run all suites.  If this is not
 *            provided, when all suites have finished this will call
 *            process.exit with a status code equal to the number of tests that
 *            failed.  If you don't need a callback but don't want it to do
 *            that, then pass something falsey
 */
exports.run = function(list, args, cb) {
  if (!list) {
    list = [];
  }
  if (list.constructor != Array) {
    // if it isn't an array, a module was passed in directly to be ran
    list = [list];
  }

  var flags = {};

  flags['Behavior'] =
    [ { longFlag: 'test-name'
      , shortFlag: 't'
      , description: 'only run tests with the specified name'
      , varName: 'name'
      }
    , { longFlag: 'suite-name'
      , shortFlag: 's'
      , description: 'only run suites with the specified name'
      , varName: 'name'
      }
    , { longFlag: 'parallel'
      , shortFlag: 'p'
      , description: 'run the suites in parallel mode'
      }
    , { longFlag: 'help'
      , shortFlag: 'h'
      , description: 'output this help message'
      }
    ]

  var options = {}
  var runnerFlags = {};

  for(var name in runners) {
    var r = runners[name];

    if (defRunner == name) {
      // this is the default
      options.runner = r;
    }
    else {
      flags['Behavior'].push(r.runnerFlag);
      runnerFlags[r.runnerFlag.longFlag || r.runnerFlag.shortFlag] = name;
    }

    flags[name + ' Runner'] = r.optionsFlags;
  };

  for (var i = 2; i < args.length; i++) {
    var found = false;;
    for (var group in flags) {
      for (var j = 0; j < flags[group].length; j++) {
        var key = null;
        if (flags[group][j].longFlag && args[i] == '--'+flags[group][j].longFlag) {
          key = flags[group][j].longFlag;
        }
        else if (flags[group][j].shortFlag && args[i] == '-'+flags[group][j].shortFlag) {
          key = flags[group][j].longFlag || flags[group][j].shortFlag;
        }
        if (key) {
          if (flags[group][j].varName) {
            var el = args.slice(i+1,i+2)[0];
            if (options[key]) {
              options[key].push(el);
            }
            else {
              options[key] = [el];
            }
            i++;
          }
          else if (key in runnerFlags) {
            options.runner = runners[runnerFlags[key]];
          }
          else {
            options[key] = true;
          }
          break;
        }
      }

      if (j != flags[group].length) {
        found = true;
        break;
      }
    }

    if (!found) {
      list.push(args[i]);
    }
  }

  if (options.help) {
    return generateHelp(flags);
  }

  if (list.length === 0) {
    list = ['.'];
  }
  // clean up list
  for(var i = 0; i < list.length; i++) {
    // if it is a filename and the filename starts with the current directory
    // then remove that so the results are more succinct
    if (list[i].indexOf(process.cwd()) === 0 && list[i].length > (process.cwd().length+1)) {
      list[i] = list[i].replace(process.cwd()+'/', '');
    }
  }

  var runner = options.runner.module.run;

  // clean up universal options
  options.testName = options['test-name'];
  options.suiteName = options['suite-name'];
  delete options['test-name'];
  delete options['suite-name'];
  delete options.runner;

  // if no callback was supplied they don't care about knowing when things
  // finish so assume we can exit with the number of 'problems'
  if (typeof cb == 'undefined') {
    cb = function (allResults) {
      var problems = 0;

      for(var i = 0; i < allResults.length; i++) {
        if (allResults[i].tests.length > 0) {
          problems += allResults[i].numErrors;
          problems += allResults[i].numFailures;
        }
      }

      process.exit(problems);
    }
  }
  runner(list, options, cb);
}

// creates the help message for running this from the command line
function generateHelp(flags) {
  var max = 0;
  for (var group in flags) {
    for (var i = 0; i < flags[group].length; i++) {
      var n = 2; // '  '
      if (flags[group][i].longFlag) {
        n += 2; // '--'
        n += flags[group][i].longFlag.length;
      }
      if (flags[group][i].longFlag && flags[group][i].shortFlag) {
        n += 2; // ', '
      }
      if (flags[group][i].shortFlag) {
        n += 1; // '-'
        n += flags[group][i].shortFlag.length;
      }

      if (n > max) {
        max = n;
      }
    }
  }

  console.log('node-async-testing');
  console.log('');

  for (var group in flags) {
    console.log(group+':');
    for (var i = 0; i < flags[group].length; i++) {
      var s = '  ';
      if (flags[group][i].longFlag) {
        s += '--' + flags[group][i].longFlag;
      }
      if (flags[group][i].longFlag && flags[group][i].shortFlag) {
        s += ', ';
      }
      if (flags[group][i].shortFlag) {
        for(var j = s.length+flags[group][i].shortFlag.length; j < max; j++) {
          s += ' ';
        }
        s += '-' + flags[group][i].shortFlag;
      }
      if (flags[group][i].varName) {
        s += ' <'+flags[group][i].varName+'>';
      }
      console.log(s + ': ' + flags[group][i].description);
    }
    console.log('');
  }
  console.log('Any other arguments are interpreted as files to run');
}
