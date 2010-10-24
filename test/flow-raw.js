var order = ''
  // Which functions should be run async or sync.  Should have the numbers
  // 1 - 7 here, but they can be in either runSync or runAsync, this gives you
  // fine tuned control over how to run the tests.
  , runSync = [0,1,2,3,4]
  , runAsync = []
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
      if (runSync.indexOf(spot) > -1) {
        r.push([list[0]].concat(right[i]));
      }
      if (runAsync.indexOf(spot) > -1) {
        r.push([list[0].toLowerCase()].concat(right[i]));
      }
    }

    return r;
  }
  else {
    var r = [];

    if (runSync.indexOf(spot) > -1) {
      r.push(list[0]);
    }
    if (runAsync.indexOf(spot) > -1) {
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
