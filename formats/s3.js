// S3 file format
// http://docs.aws.amazon.com/AmazonS3/latest/dev/LogFormat.html
// Source adapted from https://github.com/StudioLE/WatchKeep

var header = [
  'bucketOwner',
  'bucket',
  'time',
  'remoteIP',
  'requester',
  'requestID',
  'operation',
  'key',
  'requestURI',
  'httpStatus',
  'errorCode',
  'bytesSent',
  'objectSize',
  'totalTime',
  'turnAroundTime',
  'referrer',
  'userAgent',
  'versionId'
];

// Convert log format into a JSON object.
//
var convert = function(row) {
  var obj = {};
  var regexLogLine = /(\S+) (\S+) \[(\S+ \+\S+)\] (\S+) (\S+) (\S+) (\S+) (\S+) "(\S+\s\S+\s\S+)" (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) "(\S+)" "(.+)" (\S+)/;

  // Chop the line.
  var vals = regexLogLine.exec(row);
  if (vals) {
     vals.shift();  // discard the raw matched string
    if (vals.length === header.length) {
      header.forEach(function(key, index) {
        obj[key] = vals[index];
      });
      return obj;
    }
  }

  return null;
};

module.exports = {
  toJson: convert,
  fileDateFormat: 'YYYY-MM-DD',
  reportFields: header
};
