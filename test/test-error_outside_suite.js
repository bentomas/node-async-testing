if (module == require.main) {
  return require('../lib/async_testing').run(__filename, process.ARGV);
}

throw new Error();
