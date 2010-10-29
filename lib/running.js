// holds the available runners
var runners = {};
// keeps track of the default
var defRunner;

var flags = {};
flags['Behavior'] =
  [ { longFlag: 'test-name'
    , shortFlag: 't'
    , multiple: true
    , description: 'only run tests with the specified name'
    , takesValue: 'name'
    }
  , { longFlag: 'suite-name'
    , multiple: true
    , shortFlag: 's'
    , description: 'only run suites with the specified name'
    , takesValue: 'name'
    }
  , { longFlag: 'parallel'
    , shortFlag: 'p'
    , takesValue: 'what'
    , options: ['both', 'neither', 'tests', 'suites']
    , def: 'both'
    , description: 'what to run in parallel'
    }
  , { longFlag: 'help'
    , shortFlag: 'h'
    , description: 'output this help message'
    }
  ];

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

  var r = runners[m.name] =
    { module: m
    , name: m.name
    , runnerFlag: m.runnerFlag
    , optionsFlags: m.optionsFlags
    , path: p
    };

  if (def) {
    defRunner = m.name;
  }

  flags['Behavior'].push(r.runnerFlag);
  flags[m.name + ' Runner'] = r.optionsFlags;
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
exports.run = function() {
  var args = Array.prototype.slice.call(arguments)
    , cb
    ;

  if (typeof args[args.length-1] == 'function') {
    // they supplied their own callback
    cb = args.pop();
  }
  else {
    // they didn't supply a callback, so assume they don't care when this
    // ends, so, we create our own callback which exits with the number of
    // problems when everything is done
    cb = function (problems) {
      // we only want to exit after we know everything has been written to
      // stdout, otherwise sometimes not all the output from tests will have
      // been printed. Thus we write an empty string to stdout and then make sure
      // it is 'drained' before exiting
      var written = process.stdout.write('');
      if (written) {
        process.exit(problems);
      }
      else {
        process.stdout.on('drain', function drained() {
          process.stdout.removeListener('drain', drained);
          process.exit(problems);
        });
      }
    }
  }

  var fileList = [];
  var options = {}

  // fill up options and fileList
  exports.parseRunArguments(args, fileList, options, flags);

  // set individual test and suite parallel options
  options.testsParallel = options.parallel === true || options.parallel === 'tests' || options.parallel === 'both' ? true : false;
  options.suitesParallel = options.parallel === true || options.parallel === 'suites' || options.parallel === 'both' ? true : false;
  delete options.parallel;

  if (options.help) {
    return generateHelp(flags);
  }

  // if we were given no files to run, run the current directory
  if (fileList.length === 0) {
    fileList = ['.'];
  }

  // clean up fileList
  for(var i = 0; i < fileList.length; i++) {
    // if it is a filename and the filename starts with the current directory
    // then remove that so the results are more succinct
    if (fileList[i].indexOf(process.cwd()) === 0 && fileList[i].length > (process.cwd().length+1)) {
      fileList[i] = fileList[i].replace(process.cwd()+'/', '');
    }
  }

  var runner = runners[options.runner || defRunner].module.run;
  delete options.runner;

  // if no callback was supplied they don't care about knowing when things
  // finish so assume we can exit with the number of 'problems'
  if (!cb) {
  }

  runner(fileList, options, cb);
}

exports.parseRunArguments = function(args, fileList, options, flags) {
  var arg;
  while(arg = args.shift()) {
    if (typeof arg == 'string') {
      fileList.push(arg);
    }
    else if(arg.constructor == Array) {
      var i = arg == process.ARGV ? 1 : 0;
      for (; i < arg.length; i++) {
        var found = false;
        for (var group in flags) {
          for (var j = 0; j < flags[group].length; j++) {
            var flag = flags[group][j]
              , a = arg[i]
              , key = null
              , el = null
              ;

            if (a.indexOf('=') > -1) {
              a = a.split('=');
              el = a[1];
              a = a[0];
            }

            if (  (flag.longFlag && a == '--'+flag.longFlag)
               || (flag.shortFlag && a == '-'+flag.shortFlag) ) {
              key = flag.key || flag.longFlag || flag.shortFlag;
            }

            if (key) {
              key = dashedToCamelCase(key);

              if (flag.takesValue) {
                if (!el) {
                  if (!flag.options || flag.options.indexOf(arg[i+1]) > -1) {
                    el = arg.slice(i+1,i+2)[0];
                    i++;
                  }
                  else {
                    el = flag.def;
                  }
                }

                if (flag.multiple) {
                  if (options[key]) {
                    options[key].push(el);
                  }
                  else {
                    options[key] = [el];
                  }
                }
                else {
                  options[key] = el;
                }
              }
              else {
                options[key] = 'value' in flag ? flag.value : true;
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
          fileList.push(arg[i]);
        }
      }
    }
    else {
      for (var key in arg) {
        options[key] = arg[key];
      }
    }
  }
}

function dashedToCamelCase(key) {
  var parts = key.split('-');
  return parts[0] +
    parts.slice(1).map(function(str) { return str.substr(0,1).toUpperCase() + str.substr(1); }).join('');
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
      if (flags[group][i].takesValue) {
        s += ' <'+flags[group][i].takesValue+'>';
      }
      console.log(
        s +
        ': ' +
        flags[group][i].description +
        (flags[group][i].options ? ' ('+flags[group][i].options.join(', ')+')' : '')
        );
    }
    console.log('');
  }
  console.log('Any other arguments are interpreted as files to run');
}
