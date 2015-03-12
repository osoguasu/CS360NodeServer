var fs = require('fs');
var http = require('http');
var url = require('url');
var ROOT_DIR = "html/";
var MongoClient = require('mongodb').MongoClient;

http.createServer(function (req, res) {
  var urlObj = url.parse(req.url, true, false);
  if(urlObj.pathname.toLowerCase() === "/getcity") {
    console.log('Cities Route');
    fs.readFile('cities.txt', function(err, data) {
      if(err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
	return;
      }

      var myRE = new RegExp("^" + urlObj.query["q"]);
      var jsonResult = [];
      var cities = data.toString().split("\n");
      for(var i = 0; i < cities.length; i++) {
        var result = cities[i].search(myRE);
	if(result != -1) {
	  console.log(cities[i]);
	  jsonResult.push({city:cities[i]});
	}
      }
      console.log(JSON.stringify(jsonResult));
      res.writeHead(200);
      res.end(JSON.stringify(jsonResult));	
    });
  } else if (urlObj.pathname.toLowerCase() === "/comment") {
    console.log('Comment Route');
    if(req.method === 'POST') {
      console.log('POST comment route');
      // First read the form data
      var jsonData = "";
      req.on('data', function (chunk) {
        jsonData += chunk;
      });
      req.on('end', function () {
        var reqObj = JSON.parse(jsonData);
        console.log(reqObj);
        console.log("Name: " + reqObj.Name);
        console.log("Comment: " + reqObj.Comment);

	// Now put it into the database
	MongoClient.connect("mongodb://localhost/weather", function(err, db) {
	  if(err) throw err;
	  db.collection('comments').insert(reqObj,function(err, records) {
	    console.log("Record added as "+records[0]._id);
	  });
	});
      });
      res.writeHead(200);
      res.end('');
    } else if (req.method === 'GET') {
      // Read all of the database entries and return them in a JSON array
      MongoClient.connect("mongodb://localhost/weather", function(err, db) {
        if(err) { console.log('Error connecting to db: ' + err) };
        db.collection('comments', function(err, comments){
          if(err) {console.log('Error getting collection: ' + err) };
          comments.find(function(err, items){
            items.toArray(function(err, itemArr){
              console.log('Document Array: ');
              console.log(itemArr);
	      res.writeHead(200);
              res.end(JSON.stringify(itemArr));
            }); 
          });
        });
      });
    }
  } else {
    fs.readFile(ROOT_DIR + urlObj.pathname, function (err,data) {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  }
  console.log("URL path "+urlObj.pathname);
  console.log("URL search "+urlObj.search);
  console.log("URL query "+urlObj.query["q"]);
}).listen(80);



var options = {
    hostname: 'localhost',
    port: '80',
    path: '/hello.html'
  };
function handleResponse(response) {
  var serverData = '';
  response.on('data', function (chunk) {
    serverData += chunk;
  });
  response.on('end', function () {
    console.log(serverData);
  });
}
http.request(options, function(response){
  handleResponse(response);
}).end();

exports.createServer;
