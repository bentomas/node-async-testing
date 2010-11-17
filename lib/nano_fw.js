
var http = require('http')
  , messages = require('./messages')
  , url = require('url') 
  , encode = messages.encode
  , decode = messages.decode

exports.randomPort = randomPort

function randomPort(){
  return Math.round(1000 + Math.random()*40000)
}

exports.makeServer = makeServer
function makeServer(port,callbacks,ready){
  var server = http.createServer(request)

  function request(request,response){

    function sendCode(message,code){
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.end(encode(message),'utf8')
    }
    function send (message){sendCode(message,200)}
    function send404 (message){sendCode(message || "404",404)}

    if (callbacks[request.url]){
      var data = ""
      request.on('data',function(chunk) { data += chunk } )
      request.on('end',function(x){
        callbacks[request.url](decode(data),send)
      })
    } else {
      callbacks['404'] ? callbacks['404'](message,send404) : send404()
    }
  }
  server.listen(port,ready)
  return server;
}

exports.connect = connect
function connect (port,callback){
  var client = http.createClient(port)
    client.send = send
    function send (url,message,callback){
      request = client.request('POST', url);

      request.end(messages.encode(message),'utf8');
      
      request.on('response', function (response) {
        response.setEncoding('utf8');
        data = ""
        response.on('data', function (chunk) {
          data += chunk
        });
        response.on('end', function () {
          callback && callback(decode(data),send)
        });
      }) 
    }
    
  if (callback){
    callback(send)
  }
  return client
}
