
exports['test pass'] = function (test){
  test.ok(true);
  test.finish();
}

exports['test fail'] = function (test){
  test.ok(false);
  test.finish();
}

exports['test error'] = function (test){
  throw new Error('INTENSIONAL ERROR')
}

