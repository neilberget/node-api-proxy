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

var host;

http.createServer(function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With, X-Proxy-Host");
	res.setHeader("Access-Control-Allow-Credentials", "true");

	if (cannedResponseHandler(req, res))
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
	var options = {
		url: formattedUrl,
		method: req.method,
		headers: {
			  Authorization: req.headers.authorization
			, 'User-Agent': req.headers['user-agent']
			, Connection: req.headers.connection
			, cookie: req.headers.cookie
		}
	};

	console.log("Proxying %s %s", req.method, options.url);

	var body = "";
	req.on('data', function (data) {
			body += data;
	});
	req.on('end', function () {
		request(options, function(err, response, body) {
			res.setHeader('content-type', response.headers['content-type']);
			res.end(body);
		});
	});


}).listen(PORT);

console.log("server pid %s listening on port %s", process.pid, PORT);
