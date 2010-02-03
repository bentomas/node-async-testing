var sys = require('sys');
var TestSuite = require('../async_testing').TestSuite;

(new TestSuite('My Second Test Suite'))
  .runTests({
    "this does something": function(test) {
        test.assert.ok(true);
        test.finish();
      },
    "this doesn't fail": function(test) {
        test.assert.ok(true);
        setTimeout(function() {
            test.assert.ok(true);
            test.finish();
          }, 1000);
      },
    "this does something else": function(test) {
        test.assert.ok(true);
        test.assert.ok(true);
        test.finish();
      },
  });

(new TestSuite('My First Test Suite'))
  .runTests({
    "this does something": function(test) {
        test.assert.ok(true);
        test.finish();
      },
    "this fails": function(test) {
        setTimeout(function() {
            test.assert.ok(false);
            test.finish();
          }, 1000);
      },
    "this does something else": function(test) {
        test.assert.ok(true);
        test.assert.ok(true);
        test.finish();
      },
    "more": function(test) {
        test.assert.ok(true);
        test.finish();
      },
    "throws": function(test) {
        test.assert.throws(function() {
            throw new Error();
          });
        test.finish();
      },
    "expected assertions": function(test) {
        test.numAssertionsExpected = 1;
        test.assert.throws(function() {
            throw new Error();
          });
        test.finish();
      },
  });

(new TestSuite("Setup"))
  .setup(function(test) {
    test.foo = 'bar';
  })
  .runTests({
    "foo equals bar": function(test) {
      test.assert.equal('bar', test.foo);
    }
  });

var count = 0;
var ts = new TestSuite('Wait');
ts.wait = true;
ts.runTests({
    "count equal 0": function(test) {
      test.assert.equal(0, count);
      setTimeout(function() {
        count++;
        test.finish();
        }, 50);
    },
    "count equal 1": function(test) {
      test.assert.equal(1, count);
      test.finish();
    }
  });

