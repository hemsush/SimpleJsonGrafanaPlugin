/***
Sample Node js Backend for Simple Json Plugin
***/

//Import express,bodyparser,https,loadash
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');
const https = require('https');
const http= require('http');
var app = express();

app.use(bodyParser.json());

var opmanagerdata = require('./sample');


var annotation = {
  name : "annotation name",
  enabled: true,
  datasource: "Rest datasource",
  showLine: true,
}

var annotations = [
  { annotation: annotation, "title": "Alarms one Test", "time": 1450754160000, text: "test", tags: "testtag" }
];

var tagKeys = [
  {"type":"string","text":"Severity"}
];

var severityTagValues = [
  {'text': 'Critical'},
  {'text': 'Trouble'}
];

var now = Date.now();
var decreaser = 0;


  
//Setting CORS : Replace with origin needed
function setCORSHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "accept, content-type");  
}

//Methods needed for SimpleJson Grafana Plugin

app.all('/', function(req, res) {
  setCORSHeaders(res);
  res.send('Noc Alarms One Plugin');
  res.end();
});

app.all('/search', function(req, res){
  setCORSHeaders(res);
  var result = ["Severity","Displayname","message","DeviceName","category"];
  res.json(result);
  res.end();
});

app.all('/annotations', function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  res.json(annotations);
  res.end();
});

function getTableData(opRowData){
	var opRowResp=[];
	if(opRowData.length>0){
		console.log("sample response");
		console.log(opRowData.length);
		//iterate the response and frame the table json
		for(i=0;i< opRowData.length;i++){
			var opresponseData=[];
			var sevStr=opRowData[i].severityString;
			var disName=opRowData[i].displayName;
			var msg=opRowData[i].message;
			var devName=opRowData[i].deviceName;
			var ModifiedTime=opRowData[i].modTime;
			var category=opRowData[i].category;
			if(msg !==null && msg !=='' && typeof msg !== "undefined"){
				opresponseData=[sevStr,disName,msg.replace(/[&\/\\#,+()$~.'":*?<>{}]/g, ''),devName,ModifiedTime,category];
			}
			opRowResp.push(opresponseData);
	    }
  }
  return opRowResp;
}

function fetchAlarmsOnepromise(){
	return new Promise((resolve, reject) => {
		 https.get('https://webhook.site/3a343795-5203-44a6-992d-2f26e48d6ac7', (response) => {
		 //http.get('http://url, (response) => {
			let opsData = '';
                         //set NODE_TLS_REJECT_UNAUTHORIZED=0; to handle the certificate issue
			response.on('data', (fragments) => {
				//opsData += fragments;
			});

			response.on('end', () => {
				let response_body =opmanagerdata;
				resolve(JSON.parse(response_body));
				//let response_body = opsData;
			    console.log("Call completed");
			});

			response.on('error', (error) => {
				reject(error);
			});
		});
	});
}
//Main method for getting the data - supports timeseries and Table
app.all('/query', async(req, res) => {
  var opsRow=[]
  setCORSHeaders(res);
  //console.log(req.url);
  //console.log(req.body);
  var opsdata = await fetchAlarmsOnepromise();
  console.log(opsdata);
  opsRow=getTableData(opsdata);
  var table =
  {
    columns: [{text: 'Severity', type: 'string'}, {text: 'Displayname', type: 'string'},{text: 'message', type: 'string'},{text:
 'DeviceName', type: 'string'},{text: 'ModifiedTime', type: 'string'},{text: 'category', type: 'string'}],
	
    rows: opsRow
  };
  
  var tsResult = [];
  _.each(req.body.targets, function(target) {
    if (target.type === 'table') {
      tsResult.push(table);
    }
	else{
		console.log("Error - no time series data");
	}
  });
 
  res.json(tsResult);
  res.end();
});


app.all('/tag[\-]keys', function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  res.json(tagKeys);
  res.end();
});

app.all('/tag[\-]values', function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  if (req.body.key == 'Severity') {
    res.json(severityTagValues);
  } else {
    res.json(severityTagValues);
  }
  res.end();
});

app.listen(3334);

console.log("Server is listening to port 3334");
