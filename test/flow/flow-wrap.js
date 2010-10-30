// This test suite is for making sure that all the right functions are called
// in the right order. We keep track of when everything is ran and then
// output it all at the end.
//
// As such, you have to manually look at the quite cryptic output to make sure
// it is doing what you want.

if (module == require.main) {
  return require('../../lib/async_testing').run(process.ARGV, function() {/* do nothing */});
}

var async_testing = require('../../lib/async_testing')
  , wrap = async_testing.wrap
  ;

var async = true;

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
      , sF:
        { J: 'P'
        , K: 'F'
        }
      }
    , sG:
      { TT: 'F'
      , sH:
        { L: 'P'
        , M: 'F'
        }
      }
    , sI:
      { N: 'P' 
      , O: 'F'
      }
    , P: 'E'
    , sJ:
      { Q: 'E' 
      , R: 'P' 
      , S: 'F'
      , sK:
        { TS: 'E'
        , T: 'F'
        }
      , sL:
        { TT: 'E'
        , U: 'P'
        , V: 'F'
        }
      }
    , sM:
      { SS: 'E'
      , sN:
        { W: 'P'
        , X: 'F'
        }
      }
    , sO:
      { ST: 'E'
      , sP:
        { Y: 'P'
        , Z: 'F'
        }
      }
    , sQ:
      { TS: 'E'
      , sR:
        { A: 'P'
        , B: 'F'
        }
      }
    , sS:
      { TT: 'E'
      , sT:
        { C: 'P'
        , D: 'F'
        }
      }
    };

var specialKeys =
  { SS: 'suiteSetup'
  , TS: 'setup'
  , TT: 'teardown'
  , ST: 'suiteTeardown'
  };
var symbol =
  { 'P': ''
  , 'E': '!'
  , 'F': '*'
  };
var funcs = 
  { SS: function(prefix, key, state) {
      return function(d) {
        if (async) {
          setTimeout(doIt, 10);
        }
        else {
          doIt();
        }

        function doIt() {
          order += prefix + key + '0' + symbol[state] + '\n';
          if (state == 'E') {
            throw new Error('error in 0');
          }
          else {
            d();
          }
        }
      }
    }
  , TS: function(prefix, key, state) {
      return function(t, f) {
        if (state != 'E' && async) {
          setTimeout(doIt, 10);
        }
        else {
          doIt();
        }

        function doIt() {
          order += prefix + '   ' + key + '1' + symbol[state] + '\n';
          if (state == 'E') {
            throw new Error('error in 1');
          }
          else if (state == 'P') {
            f();
          }
          else {
            t.ok(false, 'failure in 1');
          }
        }
      }
    }
  , TT: function(prefix, key, state) {
      return function(t, f) {
        if (state != 'E' && async) {
          setTimeout(doIt, 10);
        }
        else {
          doIt();
        }

        function doIt() {
          order += prefix + '   ' + key + '3' + symbol[state] + '\n';
          if (state == 'E') {
            throw new Error('error in 3');
          }
          else if (state == 'P') {
            f();
          }
          else {
            t.ok(false, 'failure in 3');
          }
        }
      }
    }
  , ST: function(prefix, key, state) {
      return function(d) {
        if (async) {
          setTimeout(doIt, 10);
        }
        else {
          doIt();
        }

        function doIt() {
          order += prefix + key + '4' + symbol[state] + '\n';
          if (state == 'E') {
            throw new Error('error in 4');
          }
          else {
            d();
          }
        }
      }
    }
  , TEST: function(prefix, key, state) {
      return function(t, f) {
        if (state != 'E' && async) {
          setTimeout(doIt, 10);
        }
        else {
          doIt();
        }

        function doIt() {
          order += prefix + '   ' + key + '2' + symbol[state] + '\n';
          if (state == 'E') {
            throw new Error('error in 2');
          }
          else if (state == 'P') {
            f();
          }
          else {
            t.ok(false, 'failure in 2');
          }
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


setTimeout(function() {
  var len = 0;
  // get around weird bugs in node where I can't print large strings
  while (len < order.length) {
    require('util').print(order.substr(len, 200));
    len += 200;
  }
  console.log('');
}, 2200);
