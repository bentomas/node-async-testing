// This test suite is for making sure that all the right functions are called
// in the right order. We keep track of when everything is ran and then
// output it all at the end.
//
// As such, you have to manually look at the quite cryptic output to make sure
// it is doing what you want.



var order = ''
  // Which functions should be run async or sync. Each slot is a different flow
  // function and whether or not you want it to be sync or async.
  // this gives you fine tuned control over how to run the tests.
  , runSyncAsync = ['S', 'S', 'S', 'S', 'S']
  // specify which tests to create. P means that function should pass,
  // F means it should fail
  , tests =
    { A: 'PPP'
    , B: 'FPP'
    , C: 'PFP'
    , D: 'PPF'
    , E: 'FPF'
    , F: 'PFF'
    , G: 'PPPPP'
    , H: 'FPPPP'
    , I: 'PFPPP'
    , J: 'PPFPP'
    , K: 'PPPFP'
    , L: 'PPPPF'
    , M: 'FPPPF'
    , N: 'PFPFP'
    , O: 'PFPPF'
    , P: 'PPFFP'
    , Q: 'PPFPF'
    , R: 'PPPFF'
    };

for (var key in tests) {
  combinations(tests[key]).forEach(function(t) {
    var k = key;
    var test = [];
    var name = '';

    t.forEach(function(f) {
      var index = test.length + 1;

      if (f == 'P') {
        name += 'pass ';
        test.push(function(t) {
          order += (index == 1 ? '\n' : '')+k+index;
          t.finish();
        });
      }
      else if (f == 'p') {
        name += 'apass ';
        test.push(function(t) {
          setTimeout(function() {
            order += (index == 1 ? '\n' : '')+k.toLowerCase()+index;
            t.finish();
          }, 10);
        });
      }
      else if (f == 'F') {
        name += 'fail ';
        test.push(function(t) {
          order += (index == 1 ? '\n' : '')+k+index+'*';
          t.ok(false, 'failure in '+index);
        });
      }
      else {
        name += 'afail ';
        test.push(function(t) {
          setTimeout(function() {
            order += (index == 1 ? '\n' : '')+k.toLowerCase()+index+'*';
            t.ok(false, 'failure in '+index);
          }, 10);
        });
      }
    });

    exports[name.trim()] = test;
  });
}

function combinations(list, spot) {
  if (!spot) {
    spot = 0;
  }
  if (list.length > 1) {
    var right = combinations(list.slice(1), spot+1);
    var r = [];

    for (var i = 0; i < right.length; i++) {
      if (runSyncAsync[spot] == 'S') {
        r.push([list[0]].concat(right[i]));
      }
      else {
        r.push([list[0].toLowerCase()].concat(right[i]));
      }
    }

    return r;
  }
  else {
    var r = [];

    if (runSyncAsync[spot] == 'S') {
      r.push(list[0]);
    }
    else {
      r.push(list[0].toLowerCase());
    }
    return  r;
  }
}

process.on('exit', function() {
    console.log(order);
  });

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
