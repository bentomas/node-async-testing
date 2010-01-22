var test = require('./asyncTesting').test;

test("this does something", function(test) {
        test.assert.ok(true);
        test.finish();
      });
test("this doesn't fail", function(test) {
        test.assert.ok(true);
        setTimeout(function() {
            test.assert.ok(true);
            test.finish();
          }, 1000);
      });
test("this does something else", function(test) {
        test.assert.ok(true);
        test.assert.ok(true);
        test.finish();
      });
test("this fails", function(test) {
        setTimeout(function() {
            test.assert.ok(false);
            test.finish();
          }, 1000);
      });
test("throws", function(test) {
        test.assert.throws(function() {
            throw new Error();
          });
        test.finish();
      });
