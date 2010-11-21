//test_reports.asynct

var should = require('should')
  , TestReports = require('async_testing/lib/test_reports')
  , subtree = require('async_testing/lib/subtree')
  , assertObj = TestReports.assertObj
  , assert = require('assert')
  , query = require('query')
/*
reports will be:
  SuiteStart
    { suite: 'suitename'
    , filename: 'filename'
    , status: 'started'
    , testNames : ['testnames',...] }
  TestStart
    {test: 'testname', status: started}
  TestDone
    { test: 'testname'
    , status: 'success/failure/error'
    , failure: Error/Assertion
    , failureType: 'Error' }
  
  SuiteDone
    { suite: 'suitename'
    , filename: 'filename'
    , status: 'success/failure/error'
    , tests: [list of TestDone reports]
    , error: if error outside of a test }


    currently this does not cover cases where there is an error outsite a test
    (like a syntax error, or other invalidating error!)
*/

exports ['can create a test report'] = function (test){
  var tests = ['test1','test2','test3']
  r = TestReports(__filename) //report for this test.  
//  test.equal(r.suiteStarted 

  test.equal(r.filename,__filename)

  r.should.have.property('filename',__filename)
  r.should.have.property('suite','test_reports.asynct')

  r.should.have.property('suiteStart')

  r.testNames = tests
  var ss = r.suiteStart()
  
  ss.should.have.property('suite', 'test_reports.asynct')
  ss.should.have.property('filename', __filename)
  ss.should.have.property('status', 'started')
  ss.should.have.property('testNames').eql(tests)
    
  
  st1 = r.testStart ('test1')
  st1.should.have.property('test', 'test1')
  ss.should.have.property('status', 'started')

  test.throws(function (){
    r.testStart ('not a test')
  })
  
  t1 = r.testDone ('test1')
  t1.should.have.property('test', 'test1')
  t1.should.have.property('status', 'success') //test has no errors.
 
  t2 = r.testStart ('test2')
  var err = new Error()
  r.error('test2',err)

  t2 = r.testDone ('test2')
  t2.should.have.property('test', 'test2')
  t2.should.have.property('failureType', 'Error')
  t2.should.have.property('status', 'error') //test has no errors.
  t2.should.have.property('failure', err) //test has no errors.
 
  r.testStart ('test3')
 
  var err = null
  try { true.should.eql(false) } catch (e) {err = e}
  r.failure('test3',err)

  t3 = r.testDone ('test3')
  
  t3.should.have.property('test', 'test3')
  t3.should.have.property('failureType', 'AssertionError')
  t3.should.have.property('status', 'failure') //test has no errors.
  t3.should.have.property('failure', err) //test has no errors.
  
  sd = r.suiteDone()

  sd.should.have.property('suite', 'test_reports.asynct')
  sd.should.have.property('filename', __filename)
  sd.should.have.property('status', 'error')
  sd.should.have.property('tests').eql([t1,t2,t3])
  sd.should.have.property('testNames').eql(tests)

  test.finish()
}

//no tests is not a success!

exports ['no tests is not a success!'] = function (test){

  var tests = ['test1','test2','test3']
  r = TestReports(__filename) //report for this test.  

  var sd = r.suiteDone()
  
  sd.should.have.property('status', 'error')

  test.finish()
}

exports ['chaining dsl for generating report'] = function (test){

  var r = TestReports(__filename)
    .test('test1',new Error("fail"))
    .test('test2',"STRING THROW")
    .test('test3')
    .test('test4',assertObj.ok(false))
    .suiteDone()

  r.should.have.property('suite', 'test_reports.asynct')
  r.should.have.property('filename', __filename)
  r.should.have.property('status', 'error')
  r.should.have.property('testNames').eql(['test1','test2','test3','test4'])
  r.should.have.property('tests')

  function testTestReport(name,status,error){
    t1 = query(r.tests).first({test: name})

    t1.should.have.property('test',name)
    t1.should.have.property('status',status)
    error && errorEql(t1.failure,error)
  }

  testTestReport('test1','error',new Error("fail"))
  testTestReport('test2','error',"STRING THROW")
  testTestReport('test3','success')
  testTestReport('test4','failure',assertObj.ok(false))
  
  test.finish()
}

function errorEql(b,a){
    delete b.stack
    delete a.stack
    b.should.eql(a)
}

exports ['ability to get a assert without throwing it'] = function (test){

  var asserts = 
        { ok : [false]
        , ifError: [new Error ()]
        , equal : [1,2] }
        
  query(asserts).each(function (v,k){
    try{ assert[k].apply(null,v) } catch (a) { 
      var b = assertObj[k].apply(null,v)
      errorEql(b,a)
    }
  })
  test.finish()
}

exports ['if no errors then status is success'] = function (test){
  var r = TestReports(__filename)
    .test('test1')
    .test('test2')
    .test('test3')
    .test('test4')
    .suiteDone()
    
    r.should.have.property('status','success')
    t.tests.forEach(function (e){
      e.should.have.property('status','success')
    })

  test.finish()
}
