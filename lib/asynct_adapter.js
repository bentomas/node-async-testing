
exports.runTest = function (file,callbacks){
  test = require(file)
  require('async_testing').runSuite(test,callbacks)
}
