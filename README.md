node-async-testing
==================

A simple test runner for testing asynchronous code

Goals of the project:

+ Tests should just be functions. Simple and intuitive.
+ You shouldn't have to learn new assertion functions.  Use the assertion module
  that comes with Node. If you are familiar with it you won't have any problems.  
+ Test files should be executable by Node.  No preprocessors.  If your test file
  is called "my_test_file.js" then "node my_test_file.js" should run the tests.
+ Node is asynchronous, so testing should be too.
+ Not another Behavior Driven Development testing framework. I don't
  like specifications and what not. They only add verbosity. 
+ Make no assumptions about the code being tested.  You should be able to test
  any code, and all aspects of it.

Feedback/suggestions encouraged!

Installing
----------

To install using npm do this:

    npm install async_testing

To install by hand, the file `async_testing.js` needs to be in your Node path.  The
easiest place to put it is in `~/.node_libraries`. To install the command line
script, you need to put  the file `bin/node-async-test.js` in your `$PATH`
somewhere (I like to rename it to just `node-async-test`).

Writing Tests
-------------

The hard part of writing a test suite for asynchronous code is that when a test
fails, you don't know which test it was that failed. Errors won't get caught by
`try`/`catch` statements.

This module addresses that by

1.  giving each test its own unique assert object. This way you know
    which assertions correspond to which tests.
2.  running (by default) the tests one at a time.  This way it is possible to
    add a global exceptionHandler for the process and catch the errors whenever
    they happen.
3.  requiring you to tell the test runner when the test is finished.  This way
    you don't have any doubt as to whether or not an asynchronous test still
    has code to run. (though you still have to be very careful when you finish
    a test!)

**node-async-testing** tests are just a functions:

    function asynchronousTest(test) {
      setTimeout(function() {
        // make an assertion (these are just commonjs assertions)
        test.ok(true);
        // finish the test
        test.finish();
      });
    }

**node-async-testing** makes no assumptions about tests, so even if your test is
not asynchronous you still have to finish it:

    function synchronousTest(test) {
      test.ok(true);
      test.finish();
    };

**node-async-testing** is written for running suites of tests, not individual
tests. A test suite is just an object with tests:

    var suite = {
      asynchronousTest: function(test) {
        setTimeout(function() {
          // make an assertion (these are just commonjs assertions)
          test.ok(true);
          // finish the test
          test.finish();
        });
      },
      synchronousTest: function(test) {
        test.ok(true);
        test.finish();
      }
    }

If you want to be explicit about the number of assertions run in a given test,
you can set `numAssertions` on the test. This can be very helpful in
asynchronous tests where you want to be sure all callbacks get fired.

    suite['test assertions expected (fails)'] = function(test) {
      test.numAssertions = 3;

      test.ok(true);
      test.finish();
      // this test will fail!
    }

If you need to make assertions about what kind of errors are thrown, you can
add an `uncaughtExceptionHandler`:

    suite['test catch sync error'] = function(test) {
      var e = new Error();

      test.uncaughtExceptionHandler = function(err) {
        test.equal(e, err);
        test.finish();
      }

      throw e;
    };

All of the examples in this README can be seen in `examples/readme.js` which
can be run with the following command:

    node examples/readme.js

Because all tests are just functions, writing setup or teardown functions is as
simple as writing a wrapper function which takes a test and returns a new test:

    function setup(testFunc) {
      return function newTestFunc(test) {
        var extra1 = 1;
        var extra2 = 2;
        testFunc(test, extra1, extra2);
      }
    }

    suite['wrapped test'] = setup(function(test, one, two) {
      test.equal(1, one);
      test.equal(2, two);
      test.finish();
    });

**node-async-testing** comes with a convenience function for wrapping all tests
in a suite:

    require('async_testing').wrapTests(suite, setup);

See `test/test-wrap_tests` for more details.

Additionally, the you can look at any of the files in the `test` directory for
examples.

Running test suites
-------------------

The easiest way to run a suite is with the `run` method:

    require('async-testing').run(suite);

The `run` command can take a test suite, a file name, a directory name (it
recursively searches the directory for javascript files that start with `test-`)
or an array of any of those three options.

The recommended way to write and run test suites is by making the `exports`
object of your module the test suite object. This way your suites can be run by
other scripts that can do interesting things with the results.  However, we
still want to be able to run that suite via the `node` command. Here's how to
accomplish all that:

    exports['first test'] = function(test) { ... };
    exports['second test'] = function(test) { ... };
    exports['third test'] = function(test) { ... };

    if (module === require.main) {
      require('async_testing').run(__filename);
    }

Now, that suite can be run by calling the following from the command line (if it
were in a file called `mySuite.js`):

    node mySuite.js

Additionally, the `run` command can be passed an array of command line arguments
that alter how it works:

    exports['first test'] = function(test) { ... };
    exports['second test'] = function(test) { ... };
    exports['third test'] = function(test) { ... };

    if (module === require.main) {
      require('async_testing').run(__filename, process.ARGV);
    }

Now, you can tell the runner to run the tests in parallel:

    node mySuite.js --parallel

Or only run a specific test:

    node mySuite.js --test-name "first test"

Use the `help` flag to see all the options:

    node mySuite.js --help

**node-async-testing** also comes with a command line script that will run all
test files in a specified directory. To use the script, make sure
**node-async-testing** has been installed properly and then run:

    node-async-test tests-directory

Or you can give it a specific test to run:

    node-async-test tests-directory/mySuite.js

The advantage of using the `node-async-test` command is that its exit status
will output the number of failed tests.  This way you can write shell scripts
that do different things depending on whether or not the suite was successful.

Custom Reporting
----------------

It is possible to write your own test runners.  See `node-async-test` or
`runners.js` for examples or `API.markdown` for a description of the different
events and what arguments they receive.

This feature is directly inspired by Caolan McMahon's [nodeunit].  Which is an
awesome library.

[nodeunit]: http://github.com/caolan/nodeunit
