Node API Proxy
==============

Node API proxy is a dumb API server and proxy that does a couple
things:

1. Catches requests on configued routes and sends back canned responses
2. Proxies everything else on to an external server

If it proxies a request to the external server it will
simply return the results back to the requesting application.


##Motivation

When building a new mobile or web client you might need it to
interact with an API server. Building API endpoints can be
expensive and limits the opportunity to rapidly build
interactive prototypes.

By using an API proxy you can build canned JSON responses 
to return on routes you haven't built out yet. Thus you
can quickly scaffold the front-end of your application
while the API endpoints are built out.

It also allows you to be more thoughtful about your API spec.


##How to Use

Using Node API Proxy is a relatively simple process of updating
the server address you use on your API client application and
then setting up a configuration file.


###Your Client

In your calling application, you might do something like this:

```javascript
var request = require('request');

request.get('http://api.yourwebsite.com/v3/users', function(err, res, body) {
	// Do something with the response
});
```

--or on a web client with jQuery--

```javscript
$.get('http://api.yourwebsite.com/v3/users', function(data) {
	// Do something with the data
});
```

Instead of hitting your API server directly, set up your code to point
to this running process:

```javascript
var request = require('request');

request.get('http://localhost:4040/v3/users', function(err, res, body) {
	// Do something with the response
});
```


###API server proxy configuration

First create a new configuration file called `config.json`. It takes an
array of configurations. Here is an example:

```javascript
{
	"canned": {
		"/v2.4/funding" : "../../canned/funding.json",
		"/v2.4/schools" : "../../canned/schools.json",
		"/v2.4/members" : "../../canned/members.json"
	},

	"proxies": [
		{
			"host": "https://api.myservice.com/v2.4",
			"proxyURL": "/v2.4/"
		},
		{
			"host": "http://newapi.myservice.com/v3",
			"proxyURL": "/v3/"
		}
	]
}
```

In this configuration, '/v2.4/members' is in the "canned" block. 
If the client is requesting:

```
http://localhost:4040/v2.4/members
```

The API server will catch this route and return the file in
"canned/v2/members.json".

For every other request your client makes to `/v2.4/*` it
will be routed to `https://api.myservice.com`. E.g.:

```
http://localhost:4040/v2.4/account
```

doesn't match any canned route so it will be proxied on to
`http://api.myservice.com/v2.4/account`


###Headers

When the requests are being proxied to the external service,
there are some decisions made about the headers. Unfortunately
I wasn't able to get `request`'s proxying functionality to
simply pipe the results back to the calling client (for some
reason it changes, for instance, the 'Authorization' header
to 'authorization' which may not work for all services).

In a huge win for lazyness I didn't investigate very far or issue
a pull request to Request. Instead I just made a few decisions
about which headers will get into the proxied request. This 
is the code:

```javascript
var options = {
	url: formattedUrl,
	headers: {
		  Authorization: req.headers.authorization
		, 'User-Agent': req.headers['user-agent']
		, Connection: req.headers.connection
	}
};
```

In the future I hope I can simply pass requests along on
using request's pipe method or have more robust header
support. Pull requests welcome!