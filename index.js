var AWS = require('aws-sdk');
var split = require('split');
var util = require('util');
var winston = require('winston');
var zlib = require('zlib');

var logFormats = require('./formats');

// data - json object representation of a log line.
var _reformat = function(data) {
  var row = [];
  for (var key in data) {
    row.push(util.format('%s="%s"', key, data[key]));
  }
  return row.join(' ');
}

var _processEvent = function(logFormat, logger, event, callback) {
  console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));

  var record = event.Records[0];
  var srcRegion = record.awsRegion;
  var srcBucket = record.s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  var srcKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  console.log('Processing', srcKey);

  var params = {
    Bucket: srcBucket,
    Key: srcKey
  };

  var s3 = new AWS.S3({ region: srcRegion });  // our s3 client
  var read = s3.getObject(params).createReadStream();
  var reader = read;
  if (logFormat.gzip) {
    var gunzip = zlib.createGunzip();
    read.pipe(gunzip);
    reader = gunzip;
  }

  var stream = reader.pipe(split());  // split() makes each line in the stream a processable chunk.
  stream.on('data', function(row) {
    var data = logFormat.toJson(row);
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

// Returns a function to use with AWS Lambda.
// http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
// http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
module.exports = function(format, transport) {
  return function(event, context, callback) {
    var logFormat = logFormats[format];
    var logger = new winston.Logger({ transports: [transport] });

    // Log every record to your favorite transport.
    transport.on('connect', function() {
      _processEvent(logFormat, logger, event, function(err) {
        transport.close();
        callback(err);
      });
    });

    transport.on('error', function(err) {
      callback(err);
    });
  };
}
