var order = '';

module.exports = {
  'test A': [ function setup(test) {
                test.numAssertions = 3
                order += 'A1';
                test.equal('A1', order);
                test.finish();
              }
            , function test(test) {
                order += 'A2';
                test.equal('A1A2', order);
                test.finish();
              }
            , function teardown(test) {
                order += 'A3';
                test.equal('A1A2A3', order);
                test.finish();
              }
            ]

// test that even if the test function throws an error, teardown is run
, 'test B': [ function setup(test) {
                order += '\nB1';
                test.finish();
              }
            , function test(test) {
                order += 'B2e';
                throw new Error('B func');
              }
            , function teardown(test) {
                order += 'B3';
                test.finish();
              }
            ]

// test that even if setup throws an error, teardown is run
, 'test C': [ function setup(test) {
                order += '\nC1e';
                throw new Error('C setup');
              }
            , function test(test) {
                order += 'SHOULD NOT GET HERE';
              }
            , function teardown(test) {
                order += 'C3';
                test.finish();
              }
            ]

// test that things don't break if teardown throws an error
, 'test D': [ function setup(test) {
                order += '\nD1';
                test.finish();
              }
            , function test(test) {
                order += 'D2';
                test.finish();
              }
            , function teardown(test) {
                order += 'D3e';
                throw new Error('D teardown');
              }
            ]

// test that later errors don't trump earlier errors
, 'test E (error in setup)': [ function setup(test) {
                order += '\nE1e';
                throw new Error('E setup');
              }
            , function test(test) {
                order += 'SHOULD NOT GET HERE';
              }
            , function teardown(test) {
                order += 'E3e';
                throw new Error('E teardown');
              }
            ]

// test that later errors don't trump earlier errors again
, 'test F (error in func)': [ function setup(test) {
                order += '\nF1';
                test.finish();
              }
            , function test(test) {
                order += 'F2e';
                throw new Error('F func');
              }
            , function teardown(test) {
                order += 'F3e';
                throw new Error('F teardown');
              }
            ]

// test failure in setup
, 'test G (failure in setup)': [ function setup(test) {
                order += '\nG1f';
                test.ok(false);
              }
            , function test(test) {
                order += 'SHOULD NOT GET HERE';
              }
            , function teardown(test) {
                order += 'G3';
                test.finish();
              }
            ]

// test failure in func
, 'test H (failure in func)': [ function setup(test) {
                order += '\nH1';
                test.finish();
              }
            , function test(test) {
                order += 'H2f';
                test.ok(false);
              }
            , function teardown(test) {
                order += 'H3';
                test.finish();
              }
            ]

// test failure in teardown
, 'test I (failure in teardown)': [ function setup(test) {
                order += '\nI1';
                test.finish();
              }
            , function test(test) {
                order += 'I2';
                test.finish();
              }
            , function teardown(test) {
                order += 'I3f';
                test.ok(false);
              }
            ]

, 'test J (async A)': [ function setup(test) {
                setTimeout(function() {
                  order += '\nA1';
                  test.finish();
                }, 500);
              }
            , function test(test) {
                setTimeout(function() {
                  order += 'A2';
                  test.finish();
                }, 500);
              }
            , function teardown(test) {
                setTimeout(function() {
                  order += 'A3';
                  test.finish();
                }, 500);
              }
            ]

// test that even if the test function throws an error, teardown is run
, 'test async B': [ function setup(test) {
                setTimeout(function() {
                  order += '\nB1';
                  test.finish();
                }, 500);
              }
            , function test(test) {
                setTimeout(function() {
                  order += 'B2e';
                  throw new Error('aB func');
                }, 500);
              }
            , function teardown(test) {
                setTimeout(function() {
                  order += 'B3';
                  test.finish();
                }, 500);
              }
            ]

// test that even if setup throws an error, teardown is run
, 'test async C': [ function setup(test) {
                setTimeout(function() {
                  order += '\nC1e';
                  throw new Error('aC setup');
                  //test.finish();
                }, 500);
              }
            , function test(test) {
                setTimeout(function() {
                  order += 'SHOULD NOT GET HERE';
                }, 500);
              }
            , function teardown(test) {
                setTimeout(function() {
                  order += 'C3';
                  test.finish();
                }, 500);
              }
            ]

// test that things don't break if teardown throws an error
, 'test async D': [ function setup(test) {
                order += '\nD1';
                setTimeout(function() {
                  test.finish();
                }, 500);
              }
            , function test(test) {
                order += 'D2';
                setTimeout(function() {
                  test.finish();
                }, 500);
              }
            , function teardown(test) {
                order += 'D3e';
                setTimeout(function() {
                  throw new Error('aD teardown');
                }, 500);
              }
            ]

// test that later errors don't trump earlier errors
, 'test async E (error in setup)': [ function setup(test) {
                order += '\nE1e';
                setTimeout(function() {
                  throw new Error('aE setup');
                }, 500);
              }
            , function test(test) {
                order += 'SHOULD NOT GET HERE';
              }
            , function teardown(test) {
                order += 'E3e';
                setTimeout(function() {
                  throw new Error('aE teardown');
                }, 500);
              }
            ]

// test that later errors don't trump earlier errors again
, 'test async F (error in func)': [ function setup(test) {
                order += '\nF1';
                setTimeout(function() {
                  test.finish();
                }, 500);
              }
            , function test(test) {
                order += 'F2e';
                setTimeout(function() {
                  throw new Error('aF func');
                }, 500);
              }
            , function teardown(test) {
                order += 'F3e';
                setTimeout(function() {
                  throw new Error('aF teardown');
                }, 500);
              }
            ]

// test failure in setup
, 'test async G (failure in setup)': [ function setup(test) {
                order += '\nG1f';
                setTimeout(function() {
                  test.ok(false);
                }, 500);
              }
            , function test(test) {
                order += 'SHOULD NOT GET HERE';
              }
            , function teardown(test) {
                order += 'G3';
                setTimeout(function() {
                  test.finish();
                }, 500);
              }
            ]

// test failure in func
, 'test async H (failure in func)': [ function setup(test) {
                order += '\nH1';
                setTimeout(function() {
                  test.finish();
                }, 500);
              }
            , function test(test) {
                order += 'H2f';
                setTimeout(function() {
                  test.ok(false);
                }, 500);
              }
            , function teardown(test) {
                order += 'H3';
                setTimeout(function() {
                  test.finish();
                }, 500);
              }
            ]

// test failure in teardown
, 'test async I (failure in teardown)': [ function setup(test) {
                order += '\nI1';
                setTimeout(function() {
                  test.finish();
                }, 500);
              }
            , function test(test) {
                order += 'I2';
                setTimeout(function() {
                  test.finish();
                }, 500);
              }
            , function teardown(test) {
                order += 'I3f';
                setTimeout(function() {
                  test.ok(false);
                }, 500);
              }
            ]
};

process.on('exit', function() {
    console.log(order);
  });

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
