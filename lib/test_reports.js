
var easy = require('easyfs')
  , should = require('should')
  , inspect = require('util').inspect
  , assert = require('assert')
  , query = require('query')
/*
  just generate the reports? 
  or also send the messages?
*/

exports = module.exports = TestReports


  exports.assertObj = 
    query(assert).map(function (e){
      return function (){
        try{
          e.apply(null,arguments)
        } catch (err) {
          return err
        }
      }
    })

  
/*function query (ary,matches){
  for (i in ary){
    var matched = true
    for(j in matches){
      if(matches[j] != ary[i][j])
        matched = false
    }
    if (matched) return ary[i]
  }
}*/

function TestReports (filename){
  if(!(this instanceof TestReports)) return new TestReports(filename)

  var secret = {}
  var self = this
  function makePrivate(name) {
      
    self.__defineGetter__(name,function (){

      return secret[name]
    })

    self.__defineSetter__(name,function (v){
      secret[name] = v
    })

    return makePrivate
  }
  
  makePrivate('filename')('suite')('testNames')('tests')('report')
  
  this.testNames = []
  this.tests = []
  this.filename = filename
  this.suite = easy.noExt(easy.file(filename))
  this.report = 
    { suite: secret.suite
    , filename: secret.filename
    , status: 'not started' 
    , tests: secret.tests
    , testNames: secret.testNames
    }

  this.suiteStart = suiteStart
  function suiteStart () {
    secret.testNames.should.not.be.empty

    secret.report.status = 'started'
    secret.report.tests = secret.tests
    secret.report.testNames = secret.testNames
    return secret.report
  }

  this.testStart = testStart
  function testStart (name) {
    secret.testNames.should.contain(name)
    var t = 
        { test: name
        , status: "started" }

    secret.tests.push(t)
    return t;
  }

  this.testDone = testDone
  function testDone (name) {

    secret.testNames.should.contain(name)
    
    var t = query(secret.tests).first({test: name})

    if(!t.failure){ t.status = 'success' }

    return t
  }

  this.failure = failure
  this.error = failure
  function failure (name,error){
    secret.testNames.should.contain(name)
    var t = query(secret.tests).first({test: name})

    assert.ok(t,"test '" + name + "' has not been started, call .startTest('" + name + "')")
  
    t.failure = error
    t.failureType = ('object' == typeof error) ? (error.name || error.constructor.name) : typeof error
    t.status = t.failureType == 'AssertionError' ? 'failure' : 'error'
  }

  this.suiteDone = suiteDone
  function suiteDone () {
    if(this.tests.length == 0){
      secret.report.status = 'error'
      secret.report.failure = "no tests"
    } else {
      secret.report.status = 'success'
      secret.tests.forEach(function (t){
        if(secret.report.status !== 'error' && t.status !== 'success')
          secret.report.status = t.status
      })
    }

    return secret.report
  }

  this.test = function (name,error){
    this.testNames.push(name)
    this.testStart(name)
    if (error)
      this.error(name,error)
    this.testDone(name)
    return this
  }
  
}
