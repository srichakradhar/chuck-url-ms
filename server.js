var express = require('express');
var mongo = require('mongodb').MongoClient;
var validUrl = require('valid-url');
var app = express();
var long_url, map_to, response, host_url;
var mlab_chuck_db = "mongodb://chuck:chuck@ds159217.mlab.com:59217/chuck_url";
var local_chuck_db = 'mongodb://localhost:27017/chuck_urls', db_url;

app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'accept, content-type, x-parse-application-id, x-parse-rest-api-key, x-parse-session-token');
     // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
});

app.get('/', function (req, res) {
  res.send("...Chuck's URL Shortner Microservice...");
});

app.get('/new/:url(*)', function (req, res) {
  
  long_url = req.params.url;
  
  if(validUrl.isUri(long_url)){
    
    if(req.headers.host == 'chuck-url.herokuapp.com'){
      db_url = mlab_chuck_db;
    }else{
      db_url = local_chuck_db;
    }
    
    mongo.connect(db_url, function(err, db) {
      
      if (err) throw err;
      
      host_url = req.headers["x-forwarded-proto"] + '://' + req.headers.host + '/';
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
          	  chuck_url: host_url + map_to
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

app.get('/:hash', function (req, res) {
  
  if(req.headers.host == 'chuck-url.herokuapp.com'){
    db_url = mlab_chuck_db;
  }else{
    db_url = local_chuck_db;
  }
  
  mongo.connect(db_url, function(err, db) {
    
    if (err) throw err;
    
    host_url = req.headers["x-forwarded-proto"] + '://' + req.headers.host + '/';
    
    var url_collection = db.collection('urls');

    url_collection.find({
      
      chuck_url: host_url + req.params.hash
      
    }).toArray(function(err, url_records){
      
      if(err) throw err;
      
      if(url_records.length > 0){
        
        res.redirect(url_records[0].original_url);
        
      }else{
        
        res.send({error:"This url is not on the database."});
        
      }
    });
  });
});

app.listen(process.env.PORT || 8080, function () {
  console.log('URL Shortner server listening on port 8080!');
});