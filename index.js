var http = require('http')
	, fs = require('fs')
	, path = require('path')
	, request = require('request')
	, routeConfig = require('./config.json')
	, PORT = 4040;

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

function cannedResponseHandler(req, res) {
	// routeConfig[req.host] is not right. req.host will always be this server URL
	if (routeConfig[req.host] && routeConfig[req.host].routes[req.url]) {
		var file = routeConfig[req.host].routes[req.url];
		console.log("Shipping canned response %s", req.url);
		fs.stat(file, function(err, stat) {
			res.writeHead(200, {
				'Content-Type': 'application/json',
				'Content-Length': stat.size
			});

			fs.createReadStream(file).pipe(res);
		});

		return true;
	}

	return false;
}

var host;

http.createServer(function(req, res) {
	if (cannedResponseHandler(req, res))
		return;

	var splitReq = req.url.split('/');
	if (splitReq.length <= 1)
		return;

	// Little bit of a snag. If we want to be able to route to
	// multiple routes we need to be able to define that route
	// in the request URL.

	// Could it be... http://localhost:4040/https/api.server.com/v2.4/blah

	if (req.url.substr(0, 3) === '/v3') {
		host = 'http://10.77.72.99:3002';
		req.url = req.url.substr(3);
	}
	else {
		host = 'https://api.edmodoqa.com';
	}

	var formattedUrl = host + req.url;
	var options = {
		url: formattedUrl,
		headers: {
			  Authorization: req.headers.authorization
			, 'User-Agent': req.headers['user-agent']
			, Connection: req.headers.connection
		}
	};

	console.log("Proxying", options.url);
	req.pipe(request(options)).pipe(res);

}).listen(PORT);

console.log("server pid %s listening on port %s", process.pid, port);