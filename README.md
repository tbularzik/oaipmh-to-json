# oaipmh-to-json
Simple tool for creating clean, clear, standalone JSON from an OAI-PMH XML feed.

Initial commit is for use with AWS Lambda. The following modules must be installed:
request: https://www.npmjs.com/package/request
xml-js: https://www.npmjs.com/package/xml-js

In Lambda, the script accepts an event object with the following parameters: { "bucketName": "", "filePath": "", "endpoint": "", "query": "" }

AWS Lambda must be given a role that allows it to access the bucket you're writing to. You can access the resulting JSON file here: https://s3.[your-region-name].amazonaws.com/[bucketName]/filePath.
