var messages = require('./messages2')
  , assert = require('assert')
  , inspect = require('inspect')    
//  , testing = require('./testing')    

if (module == require.main) {

  process.ARGV.shift()//node
  process.ARGV.shift()//__filename
  json = process.ARGV.shift()

  var opts = JSON.parse(json)

  assert.ok(opts.start,"expected .start : magic number")

  assert.ok(opts.end,"expected .end : magic number")

  assert.ok(opts.args,"expected .end : magic number")
  assert.ok('string' == typeof opts.args[0] ,"expected .end : magic number")
  assert.ok('object' == typeof opts.args[1] ,"expected .end : magic number")

  var file = opts.args[0]
    , options = opts.args[1]
    , messager = messages.useMagicNumbers(opts.start,opts.end)

  callbacks = makeCallbacks(options,send)
  
  function send(message){
    console.log(messager.messageEncode(message))
  }
/*  adapter = require(options.adapter || 'async_testing')
  adapter.runSuite(require(file),callbacks)
*/
  adapter = require(options.adapter || 'async_testing/lib/asynct_adapter')
  adapter.runTest(file,callbacks)
}

spawn = require('child_process').spawn

//master creates slave, and then slave sends messages back.
//call master with callbacks, 
//master goes through callbacks and turns gets the name of each one.
//sends a message to slave of function names.
//slave creates functions with these names, and then calls runSuite with them

exports.runFile = runFile
function runFile (file,options) {
  var normalExit = false;
  oldOnExit = options.onExit
  options.onExit = function (status,report){
    console.log("NORMAL EXIT")
    normalExit = true;
    oldOnExit && oldOnExit(status,report)
  }

  magic = messages.magicNumbers
  child = 
    spawn('node' 
      , [ __filename
        , json = JSON.stringify (
          { start: magic.start
          , end: magic.end
          , args: [file, makeMessage (options)] } ) ] )

  var buffer = ''
    , messager = messages.useMagicNumbers(magic.start,magic.end)
  child.stdout.on('data', function(data) {
    data = data.toString();

    var lines = data.split('\n');

    lines[0] = buffer + lines[0];
    buffer = lines.pop();

    console.log(">\t"+data)

    lines = messager.messageDecode(lines);

    lines.forEach(function (message){
      if(message)
        parseMessage(message,options)
    })
  })
    var errorBuffer = '';
  child.stderr.on('data', function(data) {
    errorBuffer += data.toString();
  });

/*
  always ensure that normal exit has happened?
  stall on suite done untill exit registered?

*/

  child.stderr.on('close', function() {
    if (errorBuffer && options.onSuiteDone && !normalExit) {
      options.onSuiteDone('loadError', {stderr: errorBuffer.trim()});
    }
  });
  
/*  child.on('exit', function (code){
    if(!normalExit)
      options.onSuiteDone('loadError', {failure: errorBuffer.trim()});
  })*/
}

exports.makeMessage = makeMessage
function makeMessage(callbacks){
  message = {}
  for(i in callbacks){
    if('function' === typeof callbacks[i]){
      message[i] = 'typeof function'
    } else {
      message[i] = callbacks[i]
    }
  }
  return message  
}

exports.makeCallbacks = makeCallbacks

function makeCallbacks(message,sender){
  var callbacks = {}
  for(i in message){
    (function (j){
      if('typeof function' == message[i]){
        callbacks[j] = function (){
          args = []
          for(i in arguments){
            args[i] = arguments[i]
          }
        
          sender.call(null,[j,args])
        }
      } else {
        callbacks[j] = message[j]
      }
    })(i)
  }
  return callbacks
}

exports.parseMessage = parseMessage
function parseMessage (message,callbacks){
  
  callbacks[message[0]].apply(null,message[1])
}


