if (module == require.main) {
  return require('../lib/async_testing').run(process.ARGV);
}

throw new Error();
