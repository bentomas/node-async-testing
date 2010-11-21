
inspect = require('inspect')

function useMagicNumbers(start,end){
  start = start || Math.round(Math.random()*10000000)
  end = end || Math.round(Math.random()*100000000)
  return {
    messageEncode: messageEncode
  , messageDecode: messageDecode
  , useMagicNumbers:useMagicNumbers
  , magicNumbers: {start: start, end: end}
  }
  
  function messageEncode(x) {
    return "" + start + JSON.stringify(x) + end
  }

  function messageDecode(lines){
    return lines.map(decodeLine)
  }
  function decodeLine(string){
  
    var m = string.match("" + start + "(.*)" + end)
    if(m)
      return JSON.parse(m[1])
  }
}
module.exports = useMagicNumbers()

