var Hapi = require('hapi');

module.exports = Proxy;
function Proxy (config) {
  if(!config) {
    throw new Error("No configuration passed to Proxy ctor.");
  }

  this.config = config;
}

function normalize(path) {
  return path.indexOf("/") === 0 ? path : "/" + path;
}

Proxy.prototype.listen = function (staticDir) {
  if(!staticDir) {
    throw new Error("Proxy.prototype.listen - missing argument 'staticDir'");
  }

  var routes = this.config.routes,
    port = this.config.port || 4200,
    server = new Hapi.Server();

  server.connection({ port: port });

  server.route({
    method: "GET",
    path: '/{param*}',
    handler: {
      directory: {
        path: staticDir,
        listing: true,
        index: ['index.html']
      }
    }
  });

  routes.forEach(function (route) {
    console.log("Mapping ", route);

    server.route({
      method: route.methods || '*',
      path: route.path,
      handler: {
        proxy: {
          mapUri: function (request, callback) {
            var url = route.protocol + "://" + route.host + ":" + route.port + request.path;
            callback(null, url);
          }
        }
      }
    });
  });

  server.start(function() {
    console.log("broccoli-proxypiece: Listening on", port);
    console.log("broccoli-proxypiece: Serving up '" + staticDir + "'");
  }.bind(this));

  this.server = server;
};
