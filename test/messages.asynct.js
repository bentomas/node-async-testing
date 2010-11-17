
var messages = require('async_testing/lib/messages')
  , inspect = require('util').inspect
  , examples = 
      [ "hello"
      , 37
      , 42
      , null
      , ''
      , []
      , [24,235,436234]
      , {hello: ['a','b','c']}
      ]
  , invalid =
      [ '~m~5~m~"aaaaaaaaaaa"'
      , '~m~5~X~"aaaaaaaaaaa"'
      , '~m~hil~m~"a\naaaaaaaaaa"'
      ]
exports ['(standard interface) messageDecode (messageEncode(X).split(\'\n\')) returns X'] = function(test) {

 function checkEncodeDecode(x){
    console.log("message:" + messages.messageEncode(x))
    test.deepEqual(messages.messageDecode(messages.messageEncode(x).split('\n')),[[x]])
  }
       
  examples.forEach(checkEncodeDecode)
  checkEncodeDecode(examples)

  test.finish()
}

exports [' decode (encode(X)) returns X'] = function(test) {

 function checkEncodeDecode(x){
    test.deepEqual(messages.decode(messages.encode(x)),x)
  }
       
  examples.forEach(checkEncodeDecode)
  checkEncodeDecode(examples)

  test.finish()
}

exports [' decode (INVALID) throws exception'] = function(test) {

 function checkDecodeInvalid(x){
    test.throws(function(){
      messages.decode(x)
    },"invalid message should throw exception:" + x)
  }
       
  invalid.forEach(checkDecodeInvalid)

  test.finish()
}

