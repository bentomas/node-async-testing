
var messages = require('async_testing/lib/messages2')
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
exports ['(standard interface) messageDecode (messageEncode(X).split(\'\n\')) returns X'] = function(test) {

 function checkEncodeDecode(x){
    console.log("message:" + messages.messageEncode(x))
    test.deepEqual(messages.messageDecode(messages.messageEncode(x).split('\n')),[x])
  }
       
  examples.forEach(checkEncodeDecode)
  checkEncodeDecode(examples)

  test.finish()
}

exports ['test that messages still works in noise'] = function (test){
  var noises =
        [ "dffjasldfjdlsjf"
        , '0'
        , ' '
        , '___'
        , '~'
        , '~m~4' ] 
  
 function checkEncodeDecodeWithNoise(x,noise){
    
    console.log("message:" + messages.messageEncode(x))
    test.deepEqual(messages.messageDecode((noise + messages.messageEncode(x)).split('\n')),[x])
    test.deepEqual(messages.messageDecode((messages.messageEncode(x) + noise).split('\n')),[x])
  }
       
  noises.forEach(function (n){
    examples.forEach(function(e){checkEncodeDecodeWithNoise(e,n)})
  })
  checkEncodeDecodeWithNoise(examples,"asflasdfjlsdf")
  test.finish()
}

exports ['useMagicNumbers'] = function (test){
  test.ok(messages.useMagicNumbers)
  messager = messages.useMagicNumbers({start: 213,end:32425})
  test.ok(messager.useMagicNumbers)
  test.finish()
}
