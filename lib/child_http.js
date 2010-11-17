    console.log("CHILD HTTP")


var nano_fw = require('./nano_fw')
  , spawn = require('child_process').spawn
  
if (module == require.main) {
  
//    throw new Error ("client error")
    console.log("STARTING CHILD:" + process.ARGV[2])

    var port = JSON.parse(process.ARGV[3])
      , test 
      , opts =
        { parallel: JSON.parse(process.ARGV[4])
        , testName: JSON.parse(process.ARGV[5])
        , onTestStart: function testStart(name) {
            post('onTestStart', [name])
          }
        , onTestDone: function testDone(status, result) {
            post('onTestDone', [status, result]);
          }
        , onSuiteDone: function suiteDone(status, results) {
            post('onSuiteDone', [status, results])
          }
        }
    
      var client = nano_fw.connect(port)
      var queue = []
      var busy = false

      function post(url, messages){
        if(busy){
          queue.push([url, messages])
          return
        }
        busy = true
      
      //the problem i think, 
      //is that messages are not arriving in turn.
      //the solution is to queue them up, and pack them into one message
      //if the response hasn't come from the last one yet!
      
        console.log("post:" + url + " " + messages[0] + " -> " + (messages[1] && messages[1].name))
        client.send('/' + url, messages,drain)
        function drain(){
          console.log("DRAIN")//drain
          busy = false
          post.apply(null,queue.unshift())
        }
      }
  
      test = require(process.ARGV[2])//node exists if there is a syntax error.

          //you can't catch it.
          
          

      require('async_testing').runSuite(test,opts)

  }
  
  exports.runFile = runFile
  
  function runFile (file,opts){
    var port = nano_fw.randomPort()
      , callbacks = {}
      , server
      , child
      , timer = 0      
      , defaultTimeout = 2000
      var done = opts.onSuiteDone
      opts.onSuiteDone = function (status,report){
        clearTimeout(timer)
        done (status,report)
      }

    for (i in opts){
      (function (j){
        if('function' === typeof opts[j]){
          callbacks['/' + j] = function (message,respond){
          //  console.log("recieved message:" + i)
            opts[j].apply(null,message)
          }
        }
      })(i)
    }
    //console.log(callbacks)
    server = nano_fw.makeServer(port,callbacks,ready)

        
    function ready(){
      //console.log("READY " + file)
      var args = 
            [ __filename
            , file
            , port
            , JSON.stringify(opts.parallel || false)
            , JSON.stringify(opts.testName || null)
            ]
      var child = spawn(process.execPath, args)
      child.stdout.on('data', function (d){
        console.log("" + d)
      })
        var errorBuffer = '';
        child.stderr.on('data', function(data) {
          errorBuffer += data.toString();
        });

        child.stderr.on('close', function() {
          if (errorBuffer && opts.onSuiteDone) {
            opts.onSuiteDone('loadError', {stderr: errorBuffer.trim()});
          }
        });

      timer = setTimeout(function(){
        child.kill()
        server.close()
        timeoutError = new Error("test suite :" + file 
          + " did not exit within " + (opts.timeout || defaultTimeout))
        if(opts.onSuiteDone){
          opts.onSuiteDone('timeoutError', {failure:timeoutError, failureType: 'error'}) 
        } else { throw timeoutError}
      },opts.timeout || defaultTimeout)
      
      
    }

    return server
  }

