var http = require('http')
  , io = require('socket.io')
  , sys = require('sys')
  , path = require('path')
  , fs = require('fs')
  , asynctesting = require('./async_testing')
  , Worker = require('webworker').Worker
  ;

var contenttypes =
  { '.html': 'text/html'
  , '.css': 'text/css'
  , '.js': 'application/javascript'
  }

exports.run = function(list, options, args, callback) {
  // make sure options exists
  if (typeof options == 'undefined' || options == null) {
    options = {};
  }

  if (typeof callback == 'undefined') {
    if (options.constructor == Array) {
      callback = args;
      args = options;
      options = {};
    }
    else {
      args = [];
    }
  }

  // list needs to be an array
  if (!list) {
    list = [];
  }
  else if (list.constructor != Array) {
    // if it isn't an array, a module was passed in directly to be ran
    list = [list];
  }

  for(var i = 2; i < args.length; i++) {
    if (args[i].indexOf('-') == 0 && args[i].indexOf('--') != 0) {
      var flags = args[i].substr(1).split('');
      for(var j = 0; j < flags.length; j++) {
        flags[j] = '-'+flags[j];
      }
      args.splice.apply(args, [i, 1].concat(flags));
    }

    switch(args[i]) {
      case "--parallel":
      case "-p":
        options.parallel = true;
        break;
      case "--serial":
      case "-P":
        options.parallel = false;
        break;
      case "--test-name":
      case "-t":
        options.testName = args[i+1];
        i++;
        break;
      case "--suite-name":
      case "-s":
        options.suiteName = args[i+1];
        i++;
        break;
      case "--port":
      case "-n":
        options.suiteName = args[i+1];
        i++;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        list.push(args[i]);
    }
  }

  // if we have no items in this list, use the current dir
  if( list.length < 1 ) {
    list = ['.'];
  }

  // clean up list
  for(var i = 0; i < list.length; i++) {
    // if it is a filename and the filename starts with the current directory
    // then remove that so the results are more succinct
    if (typeof list[i] === 'string' && list[i].indexOf(process.cwd()) === 0 && list[i].length > (process.cwd().length+1)) {
      list[i] = list[i].replace(process.cwd()+'/', '');
    }
  }

  if (options.help) {
    console.log(helpMessage);
    return;
  }

  options.parallel = options.parallel || false;
  options.port = options.port || 8765;

  var suites
    , socket
    , status = { started: null, testsStarted: [], testsDone: [] }
    , queue = []
    , worker = null
    ;

  asynctesting.expandFiles(list, options.suiteName, startServer);

  function startServer(loaded) {
    suites = loaded;

    for (var i = 0; i < suites.length; i++) {
      suites[i].parallel = options.parallel;
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
          sys.pump(fs.createReadStream(dir+filename), response);
        }
        else {
          console.log(' cannot find file: ' + filename);
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
            console.log(obj);
          }
        });

        client.send(JSON.stringify({cmd: 'suitesList', suites: suites}));

        // send the current state
        for (var i = 0; i < queue.length; i++) {
          client.send(JSON.stringify({cmd: 'queued', index: queue[i][0], parallel: queue[i][1]}));
        }
        if (status.started) {
          client.send(JSON.stringify({cmd: 'suiteStart', index: status.started.index}));

          for (var i = 0; i < status.testsStarted.length; i++) {
            client.send(JSON.stringify({cmd: 'testStart', name: status.testsStarted[i]}));
          }
          for (var i = 0; i < status.testsDone.length; i++) {
            client.send(JSON.stringify({cmd: 'testDone', result: status.testsDone[i]}));
          }
        }
      });

      console.log('Test runner started -- http://localhost:'+options.port+'/');

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
      socket.broadcast(JSON.stringify({cmd: 'suitesList', suites: [suite]}));
    }
  }

  function checkQueue() {
    if (status.started) {
      // already running a test
      return;
    }

    var cmd = queue.shift();

    if (!cmd) {
      // no tests scheduled
      if (worker) {
        worker.terminate();
        worker = null;
      }
      return;
    }

    status.started = suites[cmd[0]];
    status.started.parallel = cmd[1];

    var opts =
      { name: status.started.name
      , testName: options.testName
      , parallel: status.started.parallel
      , suite: status.started.path
      , dir: __dirname
      };

    if (!worker) {
      worker = new Worker(path.join(__dirname, 'web-runner/worker-test-runner.js'));
      worker.onmessage = function(message) {
        obj = message.data;

        if (obj.cmd in workerHandlers) {
          workerHandlers[obj.cmd](obj);
        }
        else {
          console.log(obj);
        }
      }

      worker.onexit = function() {
        worker = null;
      }
    }

    worker.postMessage(opts);
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

      var i = index;

      w = new Worker(path.join(__dirname, 'web-runner/worker-test-loader.js'));

      w.onmessage = function(message) {
        obj = message.data;
        files[i].tests = obj;
        processNextItem();
      }
      w.onerror = function(message) {
        obj = message.data;
        console.log('Error: ');
        console.log(obj);
      }

      w.postMessage(files[index].path);
      index++;
    }
  }

  var socketHandlers =
    { enqueueSuite: function(obj, client) {
        //TODO reload the suite from file (if applicable) here

        queue.push([obj.index, obj.parallel]);
        var msg = {cmd: 'queued', index: obj.index, parallel: obj.parallel};
        client.broadcast(JSON.stringify(msg));
        checkQueue();
      }
    , cancel: function(obj, client) {
        if (!status.started || obj.index != status.started.index) {
          // if there is nothing started then there is nothing to terminate
          // if the indeces don't match, we've already moved on
          return;
        }

        worker.terminate();
        worker = null;

        status.started = null;
        status.testsStarted = [];
        status.testsDone = [];

        checkQueue();

        socket.broadcast(JSON.stringify({cmd: 'cancelled'}));
      }
    }

  var workerHandlers =
    { suiteStart: function() {
        var msg = {cmd: 'suiteStart', index: status.started.index};
        socket.broadcast(JSON.stringify(msg));
      }
    , suiteDone: function(obj) {
        var results = obj.results;

        var msg = {cmd: 'suiteDone', numErrors: results.numErrors, numSuccesses: results.numSuccesses, numFailures: results.numFailures};
        socket.broadcast(JSON.stringify(msg));

        status.started = null;
        status.testsStarted = [];
        status.testsDone = [];

        checkQueue();
      }
    , testStart: function(obj) {
        var name = obj.name;

        status.testsStarted.push(name);
        var msg = {cmd: 'testStart', name: name};
        socket.broadcast(JSON.stringify(msg));
      }
    , testDone: function(obj) {
        var result = obj.result;

        status.testsDone.push(result);

        var msg = {cmd: 'testDone', result: result};
        socket.broadcast(JSON.stringify(msg));
      }
    }
}
