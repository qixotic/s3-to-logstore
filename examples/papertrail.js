// Install:
//   npm install s3-to-logstore winston winston-papertrail
// aws-sdk isn't needed unless testing locally, since the Lambda service already has it.
//
// Bundle up the code:
//   zip -r papertrail.zip papertrail.js node_modules/
//
// Lastly, upload the code to your Lambda function via the AWS console or command line.

var s3ToLogstore = require('s3-to-logstore');
var winston = require('winston');
require('winston-papertrail').Papertrail;

var url = '<HOST>.papertrailapp.com:<PORT>';
var format = 'cloudfront';
var transport = new winston.transports.Papertrail({
  host: url.split(':')[0],
  port: url.split(':')[1],
  hostname: format,
  program: 'aws-lambda'
});
transport.on('error', function(error) {
  console.log('transport error:', error);
});
var options = {
  format: format,
  transport: transport,
  callback: function(error, lambdaCallback) {
    transport.close();
    lambdaCallback(error);
  }
};
exports.handler = s3ToLogstore(options);
