// Install:
//   npm install s3-to-logstore winston winston-loggly
// aws-sdk isn't needed unless testing locally, since the Lambda service already has it.
//
// Bundle up the code:
//   zip -r loggly.zip loggly.js node_modules/
//
// Lastly, upload the code to your Lambda function via the AWS console or command line.

var s3ToLogstore = require('s3-to-logstore');
var winston = require('winston');
require('winston-loggly');

var format = 'cloudfront';
var transport = new winston.transports.Loggly({
  token: '<TOKEN>',
  subdomain: '<SUBDOMAIN>',
  tags: [format],
  json: true,
  isBulk: true
});
var options = {
  format: format,
  transport: transport,
  // Loggly prefers json. Let's also use their timestamp support.
  reformatter: function(data) {
    data.timestamp = data.date + 'T' + data.time + 'Z';
    delete data.date;
    delete data.time;
    return data;
  }
};
exports.handler = s3ToLogstore(options);
