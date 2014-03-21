var http = require('http')
	, fs = require('fs')
	, path = require('path')
	, request = require('request')
	, routeConfig = require(process.argv.pop())
	, PORT = 4040;

var routeConfigLen = routeConfig.proxies.length;

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

function cannedResponseHandler(req, res) {
    if (!routeConfig.canned || !routeConfig.canned[req.url])
		return false;

	var file = path.join(__dirname, routeConfig.canned[req.url]);
	console.log("Shipping canned response %s %s", req.method, req.url);
	fs.stat(file, function(err, stat) {
		res.writeHead(200, {
			'Content-Type': 'application/json',
			'Content-Length': stat.size,
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'X-Requested-With'
		});

		fs.createReadStream(file).pipe(res);
	});

	return true;
}

function chaosHandler(req, res) {
	if (!routeConfig.chaos) return false;
  
	routeConfig.chaos.forEach(function(chaosRule) {
		if (req.url.match(chaosRule.path)) {
			var randNum = Math.random();
			if (randNum < parseFloat(chaosRule.failure_rate)) {
				console.log("Chaos!");
				res.writeHead(500, {});
				res.end("Chaos mode...");
				return true;
			}
		}
	});
}

var host;

var allowedHeaders = [
	"Authorization",
	"Content-Type",
	"X-Requested-With",
	"X-Proxy-Host"
];

http.createServer(function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
	res.setHeader("Access-Control-Allow-Headers", allowedHeaders.join(", "));
	res.setHeader("Access-Control-Allow-Credentials", "true");

	if (cannedResponseHandler(req, res))
		return;

	if (chaosHandler(req, res))
		return;

	var splitReq = req.url.split('/');
	if (splitReq.length <= 1)
		return;

	if (req.headers['x-proxy-host']) {
		host = req.headers['x-proxy-host'];
	} else {
		for (var i = 0; i < routeConfigLen; i++) {
			if (req.url.indexOf(routeConfig.proxies[i].proxyURL) === 0) {
				host = routeConfig.proxies[i].host + '/';
				req.url = req.url.substr(routeConfig.proxies[i].proxyURL.length);
				break;
			}
		}
	}

	var formattedUrl = host + req.url;

	console.log("Proxying %s %s", req.method, formattedUrl);

	req.pipe(request(formattedUrl)).pipe(res);

}).listen(PORT);

console.log("server pid %s listening on port %s", process.pid, PORT);
