//nano_fw.asynct.js

/*
  test for nano http framework.
  
  

*/

var nano = require('async_testing/lib/nano_fw')
  , inspect = require('util').inspect
/*
haha this gives a false positive! it sends a message back to the server

the server kills this test, and thinks that the test was successful!

*/

exports ['nano can connect to server'] = function (test){
  
  var port = 8082// nano.randomPort()
    , server = nano.makeServer(port,{'/':request},ready)
//    server.on('request',request)
    
    function request (message,callback){
    console.log("____ REQUEST:" + message)
      server.close()
      test.finish()    
    }
  function ready(){
    client = nano.connect(port)
    client.send('/',"client connected!")
  }
}

exports ['nano can connect to server 2'] = function (test){
  
  var port = 8081// nano.randomPort()
    , server = nano.makeServer(port,{'/':request},ready)
//    server.on('request',request)
    
  function request (message,callback){//server
    console.log("____MESSAGEL: " + message)
    test.ok(message,"expected non null message from client")
    callback("HELLO THERE!") //1
  }

  function ready(){//client
    console.log("READY")    
    client = nano.connect(port)
    client.send('/',"client connected!",c)
    function c(message,send){//2
      test.ok(message,"expected non null message from server")
      server.close();//stop
      test.finish()
    }
  }
}

exports ['server and nano connect and send json to each other'] = function (test){
 var port = 8083// nano.randomPort()
    , server = nano.makeServer(port,{'/':request},ready)
    , clientMessage = {message: "hello I am the client"}
    , serverMessage = {message: "I am the SERVER"}
  function request (message,callback){//server
    console.log("R 1")
    test.deepEqual(message,clientMessage,"expected clientMessage from client, got:" + inspect(message))
    callback(serverMessage) //1
  }

  function ready(){//client
    client = nano.connect(port)
    client.send('/',clientMessage,c)

    function c(message,send){//2
      console.log("Q 2")
      test.ok(message,"expected non null message from server")
      test.deepEqual(message,serverMessage,"expected serverMessage from server")
      send('/',clientMessage,c)
      function c(message,send){//3
    console.log("Q 3")
        test.ok(message,"expected non null message from server")
        test.deepEqual(message,serverMessage,"expected serverMessage from server")
        server.close();//stop
        test.finish()
      }
    }
  }
}

exports ['server sends 404 if no callback is defined'] = function (test){
 var port = 8084// nano.randomPort()
    , server = nano.makeServer(port,{},ready)
    , clientMessage = {message: "hello I am the client"}
    , serverMessage = {message: "I am the SERVER"}

  function ready(){//client
    client = nano.connect(port)
    client.send('/',clientMessage,c)

    function c(message,send){//2
      console.log("Q 2:" + message)
      test.ok(message,"expected non null message from server")
      test.deepEqual(message,"404","expected serverMessage from server")
      server.close();//stop
      test.finish()
    }
  }
}


exports ['nano can connect to server by url'] = function (test){
  
  var port = 8085 // nano.randomPort()
    , server = nano.makeServer(port,{'/url':request},ready)
//    server.on('request',request)
    
  function request (message,callback){//server
    console.log("____MESSAGEL: " + message)
    test.ok(message,"expected non null message from client")
    callback(message) //1
  }

  function ready(){//client
    console.log("READY")    
    client = nano.connect(port)
    client.send('/url',"client connected!",c)
    function c(message,send){//2
      test.ok(message,"expected non null message from server")
      test.equal(message,"client connected!","expected server to echo 'client connected!', but was:'" + message+"'")
      server.close();//stop
      test.finish()
    }
  }
}

