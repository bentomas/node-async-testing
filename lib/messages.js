
var messageFrame = "~m~";
// these encode/decode functions inspired by socket.io's
exports.messageDecode = function(lines) {
  return lines.map(function(str) {
    if (str.substr(0,3) !== messageFrame) {
      return str;
    }

    var msg = [];
    for (var i = 3, number = '', l = str.length; i < l; i++){
      var n = Number(str.substr(i, 1));
      if (str.substr(i, 1) == n){
        number += n;
      } else {
        number = Number(number);
        var m = str.substr(i+messageFrame.length, number);
        msg.push(JSON.parse(m));
        i += messageFrame.length*2 + number - 1;
        number = '';
      } 
    }
    return msg;
  });
}
exports.messageEncode = function() {
  var r = '';

  for (var i = 0; i < arguments.length; i++) {
    var json = JSON.stringify(arguments[i]);
    r += messageFrame + json.length + messageFrame + json;
  }

  return r;
}


exports.decode = function decodeLine(string){
  var mm = /~m~(\d+)~m~(.*)/.exec(string)
  if(!mm){
    throw new Error("could not decode :" + string + " there was no match for messageFrame ~m~[length]~m~")
  }

  var frame = mm[0]
    , len = mm[1]
    , rest = mm[2]
    if(len != rest.length){
      throw new Error("message payload should be :" + len + " long, but was:" + rest.length)
    }
    return JSON.parse(rest)
}

exports.encode = exports.messageEncode
