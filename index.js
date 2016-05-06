var AWS = require('aws-sdk');
var split = require('split');
var util = require('util');
var winston = require('winston');
require('winston-papertrail').Papertrail;
var zlib = require('zlib');

var format = require('./formats/cloudfront');

// get reference to S3 client
var s3 = new AWS.S3({ region: 'us-west-2' });

// data - json object representation of a log line.
var _reformat = function(data) {
  row = [];
  for (var key in data) {
    row.push(util.format('%s="%s"', key, data[key]));
  }
  return row.join(' ');
}

var _processEvent = function(logger, event, callback) {
  // Read options from the event.
  console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
  var srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  var srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  console.log('Processing', srcKey);

  var params = {
    Bucket: srcBucket,
    Key: srcKey
  };

  var read = s3.getObject(params).createReadStream();
  var reader = read;
  if (format.gzip) {
    var gunzip = zlib.createGunzip();
    read.pipe(gunzip);
    reader = gunzip;
  }

  var stream = reader.pipe(split()); // split() makes each line in the stream a processable chunk.
  stream.on('data', function(row) {
    var data = format.toJson(row);
    if (data) {
      logger.log('info', _reformat(data));
    }
  });

  stream.on('error', function(err) {
    callback(err);
  });

  stream.on('end', function() {
    callback();
  });
}

// Our AWS Lambda function.
// http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
// http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
exports.handler = function(event, context, callback) {
  // connect to Papertrail
  var url = 'HOST.papertrailapp.com:PORT';
  var tr = new winston.transports.Papertrail({
    host: url.split(":")[0],
    port: url.split(":")[1],
    hostname: 'aws-lambda',
    program: 'default',
    showLevel: false,
  });

  var logger = new winston.Logger({ transports: [tr] });

  // log every record to Papertrail
  tr.on('connect', function() {
    _processEvent(logger, event, function(err) {
      tr.close();
      callback(err);
    });
  });

  tr.on('error', function(err) {
    callback(err);
  });
};
