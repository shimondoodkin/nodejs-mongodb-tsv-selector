var MongoClient = require('mongodb').MongoClient;

mongodb=null;
if(mongodb==null)
MongoClient.connect('mongodb://127.0.0.1:27017/bursa?auto_reconnect=true', {},function(err, db) {
    if(err) { console.log('mongodb connection error',err); return;}
	db.authenticate('myuser', 'xxxxx', function(err, result)
	{
	 if(err) { console.log('mongodb authenticate error',err); return;}
	 if(!result) { console.log('mongodb authenticate error wrong password',err); return;}
	 mongodb=db;
	})
});

 
var collections=[];
mongodb_collection=function(name)
{
 return collections[name]||(collections[name]=mongodb.collection(name));
}

if(require.main === module) { var  repl = require("repl");repl.start({ useGlobal:true,  useColors:true, }); }
 
/*
if(mongodb==null){console.log('mongodb not initialized yet');return;}
mongodb_collection('test').insert({a:2}, function(err, docs) {
  console.dir("inserted",docs);
});
  
// Locate all the entries using find
mongodb_collection('test').find().toArray(function(err, results) {
        console.dir("find",results);
        // Let's close the db
});
//bitstamp_xmastree_ask
//bitstamp_xmastree_bid
*/
