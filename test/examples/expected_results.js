//expected results

var tests = 'async_testing/test'
exports.expected =
  {  'test-all_passing':
       { tests: 
          [ {name: 'test A'
            //, status: 'success'
            }
          , {name: 'test B'
            //, status: 'success'
            }
          , {name: 'test C'
            //, status: 'success'
            }
          , {name: 'test D'
            //, status: 'success'
            }
          ]
        }
  ,  'test-async_assertions':
        { tests: [
            { name: 'test success'
            //, status: 'success'
            }
          , { name: 'test fail'
            //, status: 'failure'
            , failure: {}
            , failureType: 'assertion'
            }
          , { name: 'test success -- numAssertions expected'
            //, status: 'success'
            }
          , { name: 'test fail -- numAssertions expected'
            //, status: 'failure'
            , failure: {}
            , failureType: 'assertion'
            }
          , { name: 'test fail - not enough -- numAssertions expected'
            //, status: 'failure'
            , failure: {}
            , failureType: 'assertion'
            }
          , { name: 'test fail - too many -- numAssertions expected'
            //, status: 'failure'
            , failure: {}
            , failureType: 'assertion'
            }
          ]
        }
  , 'test-custom_assertions':
      { tests: [
          {name: 'test custom assertion pass'
          //, status: 'success'
          }
        , {name: 'test custom assertion fail'
          //, status: 'failure'
          , failureType: 'assertion'
          }
        ]
      }
  , 'test-errors':
      { tests: [
          {name: 'test sync error'
          //, status: 'error'
          , failure: {}
          , failureType: 'error'
          }
        , {name: 'test async error'
          //, status: 'error'
          , failure: {}
          , failureType: 'error'
          }
        ]
      }
  , 'test-multiple_errors':
      { tests: [
          {name: 'test async error 1'
          //, status: 'error'
          , failure: {}
          , failureType: 'error'
          }
        , {name: 'test sync error'
          //, status: 'error'
          , failure: {}
          , failureType: 'error'
          }
        , {name: 'test async error 2'
          //, status: 'error'
          , failure: {}
          , failureType: 'error'
          }
        , {name: 'test async error 3'
          //, status: 'error'
          , failure: {}
          , failureType: 'error'
          }
        ]
      }
  , 'test-sync_assertions':
      { tests: [
          {name: 'test success'
          //, status: 'success'
          }
        , {name: 'test fail'
          //, status: 'failure'
          , failure: {}
          , failureType: 'assertion'
          }
        , {name: 'test success -- numAssertions expected'
          //, status: 'success'
          }
        , {name: 'test fail -- numAssertions expected'
          //, status: 'failure'
          , failure: {}
          , failureType: 'assertion'
          }
        , {name: 'test fail - not enough -- numAssertions expected'
          //, status: 'failure'
          , failure: {}
          , failureType: 'assertion'
          }
        , {name: 'test fail - too many -- numAssertions expected'
          //, status: 'failure'
          , failure: {}
          , failureType: 'assertion'
          }
        ]
      }
  , 'test-uncaught_exception_handlers':
      { tests: [
          {name: 'test catch sync error'
          //, status: 'success'
          }
        , {name: 'test catch async error'
          //, status: 'success'
          }
        , {name: 'test sync error fail'
          //, status: 'failure'
          , failure: {}
          , failureType: 'assertion'
          }
        , {name: 'test async error fail'
          //, status: 'failure'
          , failure: {}
          , failureType: 'assertion'
          }
        , {name: 'test sync error async fail'
          //, status: 'failure'
          , failure: {}
          , failureType: 'assertion'
          }
        , {name: 'test async error async fail'
          //, status: 'failure'
          , failure: {}
          , failureType: 'assertion'
          }
/*        , {name: 'test sync error error again'
          //, status: 'error'
          , failure: {}
          , failureType: 'error'
          }
        , {name: 'test async error error again'
          //, status: 'error'
          , failure: {}
          , failureType: 'error'
          }
        , {name: 'test sync error error again async'
          //, status: 'error'
          , failure: {}
          , failureType: 'error'
          }
        , {name: 'test async error error again async'
          //, status: 'error'
          , failure: {}
          , failureType: 'error'
          }*/
        ]
      }
  , 'test-wrap_tests': 
      { tests: [
          {name: 'sync wrap → test'
          //, status: 'success'
          }
        , {name: 'async setup → test'
          //, status: 'success'
          }
        , {name: 'async teardown → test'
          //, status: 'error'
          }
  /*      , {name: 'test teardown → test'
          //, status: 'success'
          }
        , {name: 'test teardown async → test'
          //, status: 'success'
          }*/
        ]
      }
}




