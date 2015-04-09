var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var app = express();
var url = require('url');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth-connect');
var MongoClient = require('mongodb').MongoClient;
  
var auth = basicAuth(function(user, pass) {
	return((user ==='cs360')&&(pass === 'test'));
});


var options = {
	host: '127.0.0.1',
	key: fs.readFileSync('ssl/server.key'),
	cert: fs.readFileSync('ssl/server.crt')
};

http.createServer(app).listen(80);
https.createServer(options, app).listen(443);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function (req, res) {
	res.sendfile('./html/index.html');
});

app.use('/', express.static('./html', { maxAge: 60*60*1000}));
app.get('/getcity', function (req, res) {
	var urlObj = url.parse(req.url, true, false);
	console.log("In getcity route");
	fs.readFile('cities.txt', function (err, data) {
		if(err) {
			res.writeHead(404);
			res.end(JSON.stringify(err));
			return;
		}
		
		var myRE = new RegExp('^' + urlObj.query["q"]);
		var jsonResult = [];
		var cities = data.toString().split('\n');
		for(var i = 0; i < cities.length; i++) {
			var result = cities[i].search(myRE);
			if(result != -1) {
				console.log(cities[i]);
				jsonResult.push({city:cities[i]});
			}
		}
		if(jsonResult.length == 0)
			jsonResult.push({});
		console.log(JSON.stringify(jsonResult));
		res.writeHead(200);
		res.end(JSON.stringify(jsonResult));
	});
});

app.get('/comment', function (req, res) {
	console.log('In GET comment route');
	MongoClient.connect("mongodb://localhost/weather", function (err, db) {
		if(err) {console.log('Error connecting to db: ' + err);}
		db.collection('comments', function(err, comments) {
			if(err) {console.log('Error getting collection: ' + err);}
			comments.find(function (err, items) {
				items.toArray(function (err, itemArr) {
					console.log('Document Array: ');
					console.log(itemArr);
					res.writeHead(200);
					res.end(JSON.stringify(itemArr));
				});
			});
		});
	});
});

app.post('/comment', auth, function (req, res) {

console.log("In POST comment route");
console.log(req.body.Name);
console.log(req.body.Comment);

var reqObj = {
    "Name": req.body.Name,
    "Comment": req.body.Comment
};

// Now put it into the database
MongoClient.connect("mongodb://localhost/weather", function (err, db) {
    if (err) throw err;
    db.collection('comments').insert(reqObj, function (err, records) {
        console.log("Record added as " + records[0]._id);
    });
});

res.status(200);
res.end();

});
