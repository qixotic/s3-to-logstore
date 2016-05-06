// S3 file format
// http://docs.aws.amazon.com/AmazonS3/latest/dev/LogFormat.html
// Source adapted from https://github.com/StudioLE/WatchKeep

var header = [
  'input',
  'hash',
  'host',
  'date',
  'ip',
  '-',
  'id',
  'type',
  'file',
  'http',
  'resCode',
  '-',
  'size1',
  'size2',
  'size3',
  'size4',
  'referer',
  'user-agent',
  '-'
];

// Convert log format into a JSON object.
//
var convert = function(row) {
  var obj = {};
  var regexLogLine = /(\S+) (\S+) (\S+ \+\S+\]) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+\s\S+\s\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (".+") (\S+)/;

  // Chop the line.
  var vals = regexLogLine.exec(row);
  var fields = header.length;

  if (vals && vals.length === fields) {
    header.forEach(function(key, index){
      obj[key] = vals[index];
    });
    return obj
  }

  return null;
};

module.exports = {
  toJson: convert,
  fileDateFormat: 'YYYY-MM-DD',
  reportFields: header
};
