var http = require('http')
  , util = require('util')
  , path = require('path')
  , fs = require('fs')
  , testing = require('./testing')
  , spawn = require('child_process').spawn
  , io
  ;

exports.name = 'Web';

exports.runnerFlag =
  { description: 'use the web runner for running tests from your browser'
  , longFlag: 'web'
  , key: 'runner'
  , value: 'Web'
  , shortFlag: 'w'
  };

exports.optionsFlags = 
  [ { longFlag: 'port'
    , description: 'which port to run the web server on'
    , varName: 'port'
    }
  ];

exports.run = function(list, options) {
  try {
    io = require('socket.io')
  }
  catch(err) {
    if (err.message == 'Cannot find module \'socket.io\'') {
      console.log('Dependency socket.io is not installed. Install it with:');
      console.log('');
      console.log('    npm install socket.io');
    }
    console.log('');
    console.log('node-async-testing does not depend on it to run; it is only used');
    console.log('by the web runner. Thus it isn\'t listed as dependency through npm.');
    return;
  }

  options.port = parseInt(options.port);
  if (isNaN(options.port)) {
    options.port = 8765;
  }

  var suites
    , queue = []
    , running = []
    , messageQueue = []
    , socket
    ;

  testing.expandFiles(list, options.suiteName, startServer);

  function startServer(err, loaded) {
    if (err) {
      throw err;
    }

    suites = loaded;

    suites.sort(function(a, b) {
      if (a < b) { return -1; }
      if (a > b) { return 1; }
      return 0;
    });

    for (var i = 0; i < suites.length; i++) {
      suites[i].index = i;
      suites[i].queuedTestResults = [];
    }

    for (var i = 0; i < suites.length; i++) {
      suites[i].parallel = options.testsParallel;
    }

    var dir = __dirname + '/web-runner/public';

    server = http.createServer(function(request, response){
      var filename = request.url;
      if (request.url == '/') {
        filename = '/index.html';
      }

      //console.log('request for '+filename);

      path.exists(dir+filename, function(exists) {
        if (exists) {
          response.writeHead(200, {'content-type': contenttypes[path.extname(filename)]});
          util.pump(fs.createReadStream(dir+filename), response);
        }
        else {
          console.log('cannot find file: ' + filename);
          response.writeHead(404, {'content-type': 'text/plain'});
          response.write('Not Found: ' + filename);
          response.end();
        }
      });
    });

    loadFiles(suites, function() {
      server.listen(options.port);

      // socket.io, I choose you
      socket = io.listen(server, {log: function() {}});

      socket.on('connection', function(client) {
        // connected!!

        client.on('message', function(msg) {
          obj = JSON.parse(msg);

          if (obj.cmd in socketHandlers) {
            socketHandlers[obj.cmd](obj, client);
          }
          else {
            console.log('unknown socket.io message:');
            console.log(obj);
          }
        });

        client.send(JSON.stringify({cmd: 'suitesList', suites: suites}));

        // send the current state
        for (var i = 0; i < queue.length; i++) {
          client.send(JSON.stringify({cmd: 'queued', suite: queue[i][0], parallel: queue[i][1]}));
        }
        for (var i = 0; i < running.length; i++) {
          client.send(JSON.stringify({cmd: 'suiteStart', suite: running[i].index}));
          for (var i = 0; i < running[i].testsStarted.length; i++) {
            client.send(JSON.stringify({cmd: 'testStart', name: running[i].testsStarted[i]}));
          }
          for (var i = 0; i < running[i].testsDone.length; i++) {
            client.send(JSON.stringify({cmd: 'testDone', result: running[i].testsDone[i]}));
          }
        }
      });

      console.log('Web runner started\nhttp://localhost:'+options.port+'/');

      suites.forEach(watchFile)
    });
  }

  function watchFile(suite) {
    fs.watchFile(suite.name, {interval: 500}, watchFunction)

    function watchFunction(o, n) {
      if (n.mtime.toString() === o.mtime.toString()) {
        return;
      }
      loadFiles(suite, fileLoaded);
    }

    function fileLoaded() {
      messageQueue.push(JSON.stringify({cmd: 'suitesList', suites: [suite]}));
      checkQueue();
    }
  }

  function checkQueue() {
    if (running.length && !options.suitesParallel) {
      // already running a test
      return;
    }

    var cmd = queue.shift();

    if (!cmd) {
      // no tests scheduled
      while (messageQueue.length > 0) {
        socket.broadcast(messageQueue.shift());
      }
      return;
    }

    var suite = suites[cmd[0]];

    var opts =
      { parallel: cmd[1]
      , testName: options.testName
      , onTestStart: function(name) {
          workerHandlers.onTestStart(suite, name);
        }
      , onTestDone: function(result) {
          workerHandlers.onTestDone(suite, result);
        }
      , onSuiteDone: function(status, results) {
          workerHandlers['onSuite'+status.substr(0,1).toUpperCase()+status.substr(1)](suite, results);
        }
      }

    suite.testsStarted = [];
    suite.testsDone = [];

    var msg = {cmd: 'suiteStart', suite: suite.index};
    socket.broadcast(JSON.stringify(msg));

    running.push(suite);
    suite.startTime = new Date();
    suite.child = testing.runFile(suite.path, opts);
  }

  function loadFiles(files, cb) {
    if (files.constructor != Array) {
      files = [files];
    }

    var index = 0;
    processNextItem();

    function processNextItem() {
      if (index >= files.length) {
        return cb();
      }

      var scopedIndex = index;
      var child = spawn(process.execPath, [ __dirname+'/web-runner/child-loader.js'
                                          , files[index].path
                                          ]);
      var buffer = '';
      var errorBuffer = '';

      index++;

      child.stdout.on('data', function(data) {
        data = data.toString();

        var lines = data.split('\n');

        lines[0] = buffer + lines[0];
        buffer = lines.pop();

        lines = testing.messageDecode(lines);

        for (var i = 0; i < lines.length; i++) {
          if (typeof lines[i] === 'string') {
            console.log(lines[i]);
          }
          else {
            delete files[scopedIndex].error;
            files[scopedIndex].tests = lines[i][0];
          }
        }
      });


      child.on('exit', function(code) {
        if (code !== 0) {
          delete files[scopedIndex].tests;
          files[scopedIndex].error = { message: 'Cannot load file' };
        }
        processNextItem();
      });
    }
  }

  function cleanupSuite(suite) {
    // todo remove from running array
    delete suite.testsStarted;
    delete suite.testsDone;
    delete suite.child;

    running.splice(running.indexOf(suite));

    checkQueue();
  }

  var socketHandlers =
    { enqueueSuite: function(obj, client) {
        for (var i = 0; i < queue.length; i++) {
          if (queue[i][0] == obj.index) {
            // don't add a suite to the queue, that is already in it
            return;
          }
        }
        queue.push([obj.index, obj.parallel]);
        var msg = {cmd: 'queued', suite: obj.index, parallel: obj.parallel};
        client.broadcast(JSON.stringify(msg));
        checkQueue();
      }
    , cancel: function(obj, client) {
        var suite = suites[obj.index];
        if (suite.child) {
          suite.child.kill();
          socket.broadcast(JSON.stringify({cmd: 'cancelled', suite: suite.index}));
          cleanupSuite(suite);
        }
      }
    }

  var workerHandlers =
    { onTestStart: function(suite, name) {
        suite.testsStarted.push(name);
        var msg = {cmd: 'testStart', suite: suite.index, name: name};
        socket.broadcast(JSON.stringify(msg));
      }
    , onTestDone: function(suite, result) {
        suite.testsDone.push(result);

        var msg = {cmd: 'testDone', suite: suite.index, result: result};
        socket.broadcast(JSON.stringify(msg));
      }
    , onSuiteComplete: function(suite, results) {
        var msg = {cmd: 'suiteDone', suite: suite.index, numSuccesses: results.numSuccesses, numFailures: results.numFailures};
        socket.broadcast(JSON.stringify(msg));
        cleanupSuite(suite);
      }
    , onSuiteLoadError: function(suite, obj) {
        var msg = {cmd: 'suiteLoadError', suite: suite.index};
        socket.broadcast(JSON.stringify(msg));
        cleanupSuite(suite);
      }
    , onSuiteError: function(suite, results) {
        var msg = {cmd: 'suiteError', suite: suite.index, error: results.error, tests: results.tests};
        socket.broadcast(JSON.stringify(msg));
        cleanupSuite(suite);
      }
    , onSuiteExit: function(suite, results) {
        var msg = {cmd: 'suiteExit', suite: suite.index, tests: results.tests};
        socket.broadcast(JSON.stringify(msg));
        cleanupSuite(suite);
      }
    }
}

var contenttypes =
  { '.html': 'text/html'
  , '.css': 'text/css'
  , '.js': 'application/javascript'
  }

