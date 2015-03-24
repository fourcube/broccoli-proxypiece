#!/usr/bin/env node

var fs       = require('fs');
var findup   = require('findup-sync');
var path     = require('path');
var chalk    = require('chalk');
var rimraf   = require('rimraf');
var helpers  = require('broccoli-kitchen-sink-helpers');
var Watcher  = require('broccoli/lib/watcher');
var broccoli = require('broccoli');
var argv     = require('minimist')(process.argv.slice(2));
var Proxy    = require('./proxy');

function loadProxyConfig () {
  var proxyfile = findup('Proxy.js', {nocase: true})
  if (proxyfile == null) throw new Error('Proxy.js not found')

  var baseDir = path.dirname(proxyfile)

  // The chdir should perhaps live somewhere else and not be a side effect of
  // this function, or go away entirely
  process.chdir(baseDir)

  var proxyconfig = require(proxyfile)

  return proxyconfig
}

function createWatcher(destDir, interval) {
  var tree    = broccoli.loadBrocfile();
  var builder = new broccoli.Builder(tree);
  var watcher = new Watcher(builder, {interval: interval || 100});
  var proxy;

  // We will only proxy if a Proxy.js file exists adjacent to the Brocfile.js
  try {
    var proxyConfig = loadProxyConfig();
    proxyConfig.port = argv.port || proxyConfig.port;

    proxy = new Proxy(proxyConfig);
  } catch (e) {
    console.info("INFO broccoli-proxypiece: If you would like to have requests " +
      "proxied, create a Proxy.js file adjacent to your Brocfile.js.");
  }

  var atExit = function() {
    builder.cleanup()
      .then(function() {
        process.exit(1);
      });
  };

  process.on('SIGINT', atExit);
  process.on('SIGTERM', atExit);

  watcher.on('change', function(results) {
    rimraf.sync(destDir);
    helpers.copyRecursivelySync(results.directory, destDir);

    console.log(chalk.green("Build successful - " + Math.floor(results.totalTime / 1e6) + 'ms'));
  });

  watcher.on('error', function(err) {
    console.log(chalk.red('\n\nBuild failed.\n'));
  });

  if(proxy) {
    proxy.listen(destDir);
  }

  return watcher;
}

createWatcher(argv._[0], argv._[1]);
