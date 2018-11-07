/*This pulls OAI-PMH data and converts it to a readable JSON format
Then saves it to an AWS bucket.
Accepts event object with the following parameters:
{
  "bucketName": "",
  "filePath": "",
  "endpoint": "",
  "query": ""
}*/

var request = require('request');
var convert = require('xml-js');

//AWS
var AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
//end AWS
  function convertFeed(inputRecords) {

    var outputRecords = []; //Empty array of new objects
    for (var i = 0; i < inputRecords.length; i++){ // Go though every record in input
      var outputRecord = {}; //each output record starts out blank
      var inputRecord = inputRecords[i].metadata.oai_dc; // each input record is specified


      Object.keys(inputRecord).forEach(function(recordKey){ //for each key in the input object
          if (Array.isArray(inputRecord[recordKey])){ //If it's an array, add as an array
            var outputRecordArray = []; //set a blank array to write to
            inputRecord[recordKey].forEach(function(arrayRecord, j){ //For each object in the array
              outputRecordArray[j] = arrayRecord._text; //add the object to the output Array
            });
            outputRecord[recordKey] = outputRecordArray; // add the array to the output record
          }
          else {
            outputRecord[recordKey] = inputRecord[recordKey]._text; // otherwise, just add the text
          }
      });


      outputRecords.push(outputRecord); //push each record to the outputRecords array
    }
    var JSONdoc = JSON.stringify(outputRecords); //Convert JS object to JSON document
    console.log("converted");

    //AWS
    var s3 = new AWS.S3();

    var params = {
      Bucket: event.bucketName,
      Key: event.filePath,
      Body: JSONdoc,
      ACL: 'public-read',
      ContentType: 'application/json'};

    s3.putObject(params, function (err, data) {
      if (err)
        console.log(err)
      else
        console.log("Successfully saved object to " + event.bucketName + "/" + event.filePath);
    });
    //end AWS
  }

  var docCount = 0;
  var endpoint = event.endpoint;
  var query = event.query;
  var records = [];

  function loopGet() { //function as recursive loop so that each iteration waits for previous request to complete
    docCount++;
    if (query == ""){ //if there's no query, break out of the function
      return;
    }

    request(endpoint + query, function(err, res, body) {
      if (res.statusCode == 200){
        console.log("received " + docCount);
        var data = convert.xml2js(body, {compact: true, spaces: 4, elementNameFn: function (val)
          {
            return val.replace("-","_").replace("dc:","");
          }
        });

        records = records.concat(data.OAI_PMH.ListRecords.record);

        if ("resumptionToken" in data.OAI_PMH.ListRecords && "_text" in data.OAI_PMH.ListRecords.resumptionToken){
          console.log("found resumption token");
          query = "?verb=ListRecords&resumptionToken="+data.OAI_PMH.ListRecords.resumptionToken._text;
          loopGet(); //run again if there was a resumption token
        }
        else {
          console.log("resumption token not found");
          query = "";
          convertFeed(records); //convert if there's no resumption token
          return;
        }
      }
      //If status code is not 200, abort script
      else {
        throw new Error("Status code indicates error. Execution terminated.");
      }
    });
  }

  loopGet();

}; //AWS this line
