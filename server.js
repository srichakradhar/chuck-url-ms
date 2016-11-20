var express = require('express');
var mongo = require('mongodb').MongoClient;
var validUrl = require('valid-url');
var app = express();
var long_url, map_to, response;

app.get('/', function (req, res) {
  res.send("...Chuck's URL Shortner Microservice...");
});

app.get('/new/:url(*)', function (req, res) {
  
  long_url = req.params.url;
  
  if(validUrl.isUri(long_url)){
    
    mongo.connect('mongodb://localhost:27017/chuck_urls', function(err, db) {
      if (err) throw err;
      
      var url_collection = db.collection('urls');

      url_collection.find({
        
        original_url: long_url
        
      }).toArray(function(err, url_records){
        
        if(err) throw err;
        
        if(url_records.length > 0){
          
          response = {original_url: long_url, short_url: url_records[0].chuck_url};
          db.close();
          res.send(response);
          
        }else{
          
          url_collection.count(function(err, c){
            if(err) throw err;
            map_to = c + 1;
            //simple json record
          	var document = {
          	  hash: map_to,
          	  original_url: long_url,
          	  chuck_url: 'http://chuck-url.herokuapp.com/' + map_to
          	};
            
          	//insert record
          	url_collection.insert(document, function(err, records) {
          		if (err) throw err;
          		response = {original_url: long_url, short_url: document.chuck_url};
          		db.close();
          		res.send(response);
          	});
          	
          }); // db.count
        }
      }); //db.find
        
    }); // mongo.connect
  }else{
    
    response = {error: "Wrong url format, make sure you have a valid protocol and real site."};
    res.send(response);
    
  }
}); // app.get

app.listen(process.env.PORT || 8080, function () {
  console.log('URL Shortner server listening on port 8080!');
});