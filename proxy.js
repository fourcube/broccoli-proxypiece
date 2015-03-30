var Hapi = require('hapi');

module.exports = Proxy;
function Proxy (config) {
  if(!config) {
    throw new Error("No configuration passed to Proxy ctor.");
  }

  if(config.usePayloads) {
    console.log("Serving static payloads as responses.");
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
    server = new Hapi.Server(),
    usePayloads = this.config.usePayloads;

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
    var routeHandler;
    console.log("Mapping ", route);

    // Decide if we should use a static response
    if (usePayloads) {
      routeHandler = function(request, reply) {
        reply(route.payload);
      }
    } // Or proxy the requests
    else {
      routeHandler = {
        proxy: {
          passThrough: true,
          xforward: true,
          mapUri: function (request, callback) {
            var url = route.protocol + "://" + route.host + ":" + route.port + request.path;
            callback(null, url);
          }
        }
      }
    }

    server.route({
      method: route.methods || '*',
      path: route.path,
      handler: routeHandler
    });
  });

  server.start(function() {
    console.log("broccoli-proxypiece: Listening on", port);
    console.log("broccoli-proxypiece: Serving up '" + staticDir + "'");
  }.bind(this));

  this.server = server;
};
