if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

var parse = require('../lib/running').parseRunArguments;

var flags =
  { 'group':
    [ { longFlag: 'first'
      }
    , { longFlag: 'flag-with-dashes'
      }
    , { longFlag: 'single'
      , takesValue: 'number'
      }
    , { longFlag: 'multiple'
      , takesValue: 'number'
      , multiple: true
      }
    , { longFlag: 'key'
      , key: 'keyed'
      }
    , { longFlag: 'value'
      , value: 42
      }
    , { longFlag: 'value0'
      , value: 0
      }
    , { longFlag: 'value-key'
      , key: 'keyedValued'
      , value: 10
      }
    ]
  };

module.exports =
  { 'test string': function(test) {
      var l = [];
      var o = {};

      parse(['name'], l, o, flags);

      test.deepEqual(['name'], l);
      test.deepEqual({}, o);
      test.finish();
    }
  , 'test object': function(test) {
      var l = [];
      var o = {};

      parse([{first: true}], l, o, flags);

      test.deepEqual([], l);
      test.deepEqual({first: true}, o);
      test.finish();
    }
  , 'test array': function(test) {
      var l = [];
      var o = {};

      parse([['name', '--first']], l, o, flags);

      test.deepEqual({first: true}, o);
      test.finish();
    }
  , 'test order1': function(test) {
      var l = [];
      var o = {};

      parse([{first: false}, ['--first']], l, o, flags);

      test.deepEqual({first: true}, o);
      test.finish();
    }
  , 'test order2': function(test) {
      var l = [];
      var o = {};

      parse([['--first'], {first: false}], l, o, flags);

      test.deepEqual({first: false}, o);
      test.finish();
    }
  , 'test flag -> key conversion': function(test) {
      var l = [];
      var o = {};

      parse([['--flag-with-dashes']], l, o, flags);

      test.deepEqual({'flagWithDashes': true}, o);
      test.finish();
    }
  , 'test single once': function(test) {
      var l = [];
      var o = {};

      parse([['--single', 'one']], l, o, flags);

      test.deepEqual({'single': 'one'}, o);
      test.finish();
    }
  , 'test single twice': function(test) {
      var l = [];
      var o = {};

      parse([['--single', 'one', '--single', 'two']], l, o, flags);

      test.deepEqual({'single': 'two'}, o);
      test.finish();
    }
  , 'test multiple once': function(test) {
      var l = [];
      var o = {};

      parse([['--multiple', 'one']], l, o, flags);

      test.deepEqual({'multiple': ['one']}, o);
      test.finish();
    }
  , 'test multiple twice': function(test) {
      var l = [];
      var o = {};

      parse([['--multiple', 'one', '--multiple', 'two']], l, o, flags);

      test.deepEqual({'multiple': ['one','two']}, o);
      test.finish();
    }
  , 'test key': function(test) {
      var l = [];
      var o = {};

      parse([['--key']], l, o, flags);

      test.deepEqual({'keyed': true}, o);
      test.finish();
    }
  , 'test value': function(test) {
      var l = [];
      var o = {};

      parse([['--value']], l, o, flags);

      test.deepEqual({'value': 42}, o);
      test.finish();
    }
  , 'test 0 value': function(test) {
      var l = [];
      var o = {};

      parse([['--value0']], l, o, flags);

      test.deepEqual({'value0': 0}, o);
      test.finish();
    }
  , 'test value and key': function(test) {
      var l = [];
      var o = {};

      parse([['--value-key']], l, o, flags);

      test.deepEqual({'keyedValued': 10}, o);
      test.finish();
    }
  };
