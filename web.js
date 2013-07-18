var express = require('express');
var fs = require('fs');

var app = express.createServer(express.logger());

var getContentFromFile = function (filename) {

    var bufferFile = fs.readFileSync(filename);
    if (bufferFile) {
	return bufferFile.toString();
    }
    else {

	return "content file index.html not found";
    }
};


app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {


  response.send(getContentFromFile('index.html'));
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
