# Broccoli Proxypiece

It's what you use to watch things, you know? It also serves static files
and proxies requests. If you want.

## Usage

Uses the standard `broccoli` watcher to build a tree (from the `Brocfile.js` in your projects root), and output to a directory.

Pass the name of the directory to output to as the first commandline parameter.

Place a `Proxy.js`, in your projects root to handle requests. If your build is run with `BROCCOLI_ENV=integration` all requests will be proxied. When you run `broccoli-proxypiece` build with `BROCCOLI_ENV=development`, proxypiece will respect the `payload` fields of your URL path objects and always respond with this static JSON object.


```bash
npm install -g broccoli-proxypiece
broccoli-proxypiece dist/
```

## License

This project is distributed under the MIT license.
