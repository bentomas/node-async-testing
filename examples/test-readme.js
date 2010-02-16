var TestSuite = require('../async_testing').TestSuite;

exports['README examples suite'] = (new TestSuite())
  .setup(function() {
    this.foo = 'bar';
  })
  .teardown(function() {
    this.foo = null;
  })
  .addTests({
    "simple asynchronous": function(assert, finished) {
      setTimeout(function() {
        assert.ok(true);
        finished();
      });
    },
    "simple synchronous": function(assert) {
      assert.ok(true);
    },
    "synchronous foo equal bar": function(assert) {
      assert.equal('bar', this.foo);
    },
    "asynchronous foo equal bar": function(assert, finished, test) {
      process.nextTick(function() {
        assert.equal('bar', test.foo);
        finished();
      });
    },
    "assertions expected": function(assert) {
      this.numAssertionsExpected = 3;

      assert.ok(true);
      // this test will fail!
    }
  });

if (module === require.main) {
  require('../async_testing').runSuites(exports);
}
