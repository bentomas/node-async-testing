var async_testing = require('../lib/async_testing')
  , wrap = async_testing.wrap
  ;

var order = ''
  // specify which tests to create. P means that function should pass,
  // F means it should fail
  , tests =
    { A: 'P' 
    , B: 'F'
    , sA:
      { C: 'P' 
      , D: 'F'
      , sB:
        { E: 'P' 
        , F: 'F'
        }
      , sC:
        { TS: 'F'
        , G: 'F'
        }
      , sD:
        { TT: 'F'
        , H: 'P'
        , I: 'F'
        }
      }
    , sE:
      { TS: 'F'
      , sL:
        { J: 'P'
        , K: 'F'
        }
      }
    , sF:
      { TT: 'F'
      , sN:
        { L: 'P'
        , M: 'F'
        }
      }
    , sG:
      { N: 'P' 
      , O: 'F'
      }
    };

var specialKeys =
  { SS: 'suiteSetup'
  , TS: 'setup'
  , TT: 'teardown'
  , ST: 'suiteTeardown'
  };
var funcs = 
  { SS: function(prefix, key) {
      return function(d) {
        order += prefix + key + '0\n';
        d();
      }
    }
  , TS: function(prefix, key, state) {
      return function(t, f) {
        order += prefix + '   ' + key + '1' + (state == 'P' ? '' : '*') + '\n';
        if (state == 'P') {
          f();
        }
        else {
          t.ok(false, 'failure in 1');
        }
      }
    }
  , TT: function(prefix, key, state) {
      return function(t, f) {
        order += prefix + '   ' + key + '3' + (state == 'P' ? '' : '*') + '\n';
        if (state == 'P') {
          f();
        }
        else {
          t.ok(false, 'failure in 3');
        }
      }
    }
  , ST: function(prefix, key) {
      return function(d) {
        order += prefix + key + '4\n';
        d();
      }
    }
  , TEST: function(prefix, key, state) {
      return function(t, f) {
        order += prefix + '   ' + key + '2' + (state == 'P' ? '' : '*') + '\n';
        if (state == 'P') {
          f();
        }
        else {
          t.ok(false, 'failure in 2');
        }
      }
    }
  };
function convert(obj, p, prefix) {
  var wrapper = { suite: obj };

  if (typeof prefix != 'string') { prefix = ''; }
  if (!obj.SS) { obj.SS = 'P'; }
  if (!obj.ST) { obj.ST = 'P'; }
  if (!obj.TS) { obj.TS = 'P'; }
  if (!obj.TT) { obj.TT = 'P'; }

  for (var key in obj) {
    if (typeof obj[key] == 'string') {
      var k = key  in specialKeys ? p : key;
      obj[key] = (funcs[key] || funcs.TEST)(prefix, k, obj[key]);
      if (key in specialKeys) {
        wrapper[specialKeys[key]] = obj[key];
        delete obj[key];
      }
    }
    else {
      var c = convert(obj[key], key, prefix + '   ');
      wrapper.suite[key] = c;
    }
  }

  return wrap(wrapper);
}

module.exports = convert(tests, '__');
//console.log(require('util').inspect(module.exports, null, 3));


process.on('exit', function() {
    console.log(order);
  });

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
