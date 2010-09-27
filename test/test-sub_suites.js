
module.exports =
  { 'sub-suite A':
    { 'test success': function(test) {
        test.ok(true, 'A success');
        test.finish();
      }
    , 'test fail': function(test) {
        test.ok(false, 'A fail');
        test.finish();
      }
    }
  , 'sub-suite B':
    { 'test success': function(test) {
        test.ok(true, 'B success');
        test.finish();
      }
    , 'test fail': function(test) {
        test.ok(false, 'B fail');
        test.finish();
      }
    }
  , 'sub-suite C':
    { 'test success': function(test) {
        test.ok(true, 'C success');
        test.finish();
      }
    , 'test fail': function(test) {
        test.ok(false, 'C fail');
        test.finish();
      }
    , 'sub':
      { 'test success': function(test) {
          test.ok(true, 'C sub success');
          test.finish();
        }
      , 'test fail': function(test) {
          test.ok(false, 'C sub fail');
          test.finish();
        }
      }
    }
  };

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
