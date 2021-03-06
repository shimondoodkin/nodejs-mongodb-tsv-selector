var fs = require("fs");
var compress = require('compression')();
var express = require("express");
var auth = require('http-auth').basic({ realm: "Password Protected Area." }, function (username, password, callback) {  callback(username === "you" && password === "you");   });
var app = express();
//app.use(auth);  
app.use(compress);  

logerror=function(err){ var logsizemb = fs.statSync("errorlog.txt")["size"]>>20;if(logsizemb>30) return; fs.appendFileSync('errorlog.txt',new Date().toString()+':\n'+(err.stack||err)+'\n\n'); }
//app.use(express.static(__dirname + "/public")); //use static files in ROOT/public folder

app.get("/", function(request, response){ //root dir
    response.send("Hello!!");
});

getExternalIp=function(){var e=require("os").networkInterfaces();var t,n,r,i;for(t in e){if(t.indexOf("lo")!==-1||!e.hasOwnProperty(t)){continue}for(n=0,r=e[t].length;n<r;n++){i=e[t][n];if(i.family==="IPv4"&&i.internal===false){return i.address}}}console.log("External Ip Not found!");return"127.0.0.1"}
var server = app.listen(9579, function () {

  var host = getExternalIp();//server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s/query.tsv', host, port)

})
 
require("./mongodb.js");
var ObjectID = require('mongodb').ObjectID
 function iterate(obj, stack,result,stack2,result2) {
	for (var property in obj) {
		if (obj.hasOwnProperty(property)) {
			var name=property.match(/[A-Z-a-z_@$][A-Z-a-z_@$0-9]*/)? property: '["'+property.replace('"','\\"')+'"]';
			if (typeof obj[property] == "object" && !(obj[property] instanceof ObjectID) ) {
				iterate(obj[property], stack + '.' + property,result, stack2 + '.' + name,result2);
			} else {
				//console.log(property + "   " + obj[property]);
				result.push(stack + (stack.length?'.':'') + property)
				result2.push(stack2 + '.' + name)
			}
		}
	}
}

function iterate2(obj,stack2,result2) { 
	for (var property in obj) {
		if (obj.hasOwnProperty(property)) {
			var name=property.match(/[A-Z-a-z_@$][A-Z-a-z_@$0-9]*/)? property: '["'+property.replace('"','\\"')+'"]';
			if (typeof obj[property] == "object") {
				iterate2(obj[property], stack2 + '.' + name,result2);
			} else {
				//console.log(property + "   " + obj[property]);
				result2.push(stack2 + '.' + name)
			}
		}
	}
}


app.get("/query.tsv", function(req, res){ //root dir
	res.set({ 'content-type': 'text/tab-separated-values; charset=utf-8' })
	var closed=false;
	req.on("close", function() {
	  closed=true;
	  stream.destroy();
	});

	var toarray,stream,paused=false
	
	mongodb_collection('mycollection').findOne({}, {skip:1, limit:1/* ,fields:{b:1}*/,sort:{_id:-1}}, function(err, document) {
		if(err) {logerror(err);console.log(err.stack); return;}
		
		var titles=[], varnames=[]; iterate(document, '',titles,'o',varnames);
		eval( 'function toarray2(o) { return [ '+' (function(){try{ return ' + varnames.join('} catch(e){return ""}})()'+ ", "+'(function(){try{ return ') +' } catch(e){return ""}})()'+' ] }; ' );
		toarray=toarray2;// copy to local for faster work 
		res.write(titles.join('\t'))
		
			//var i=0;                            see here is a limit vvv possible to remove or change, 
		stream=mongodb_collection('mycollection').find({}, {skip:1, limit:25000/* ,fields:{b:1}*/,sort:{_id:1}}).batchSize(1000).stream();
		res.on('drain',function(){ paused=false; stream.resume(); })
		stream.on('data',function(row) {
			
			if(!closed)
			{
				var flushed = res.write("\n"+toarray(row).join('\t'))
				if(!flushed&&!paused){paused=true;stream.pause()}
			}
			//else console.log("write",i++);
		});//stream.on
		stream.on('error',function(err) {
		    
			if(err) {logerror(err);console.log(err.stack); return;}
		});//stream.on
		stream.on('end',function(err) {
			  console.log('done');
			  res.end();
		});//stream.on
		
	});
	
});
