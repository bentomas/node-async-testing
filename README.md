node-async-testing
==================

A simple test runner for testing asynchronous code.

**node-async-testing**...

+ fully embraces Node's async environoment
+ supports parallel test and suite execution
+ has true test _and_ suite setup and teardown functions
+ helps your organize your suites by allowing you to group different tests
  together in sub-suites
+ allows you to easily add your own custom assertion methods
+ let's you customize test output for your particular needs

See [bentomas.github.com/node-async-testing](http://bentomas.github.com/node-async-testing) 
for the full details.

Feedback/suggestions encouraged!

Installing
----------
      
With npm:

    npm install async_testing
        
By hand:

    mkdir -p ~/.node_libraries
    cd ~/.node_libraries
    git clone --recursive git://github.com/bentomas/node-async-testing.git async_testing
