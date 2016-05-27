// Cloudtrail
// http://docs.aws.amazon.com/awscloudtrail/latest/userguide/eventreference.html
// Source adapted from https://github.com/StudioLE/WatchKeep

/*
Example log entry.

{ "Records": [
  {
    "awsRegion": "us-west-2",
    "eventID": "0aafa322-d19c-4770-bb8d-a55bdexample",
    "eventName": "DescribeTrails",
    "eventSource": "cloudtrail.amazonaws.com",
    "eventTime": "2016-05-06T23:42:00Z",
    "eventType": "AwsApiCall",
    "eventVersion": "1.04",
    "recipientAccountId": "123456780000",
    "requestID": "20899f06-13e4-11e6-a894-bd246example",
    "requestParameters": {
        "trailNameList": []
    },
    "responseElements": null,
    "sourceIPAddress": "192.168.0.1",
    "userAgent": "signin.amazonaws.com",
    "userIdentity": {
        "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
        "accountId": "123456780000",
        "arn": "arn:aws:iam::123456780000:user/ausername",
        "invokedBy": "signin.amazonaws.com",
        "principalId": "AIDAIRVC6GAIPZEXAMPLE",
        "sessionContext": {
            "attributes": {
                "creationDate": "2016-05-06T16:15:45Z",
                "mfaAuthenticated": "false"
            }
        },
        "type": "IAMUser",
        "userName": "ausername"
    }
  }
  ]
}
*/

var reportFields = [
  'awsRegion',
  'eventID',
  'eventName',
  'eventSource',
  'eventTime',
  'eventType',
  'eventVersion',
  'recipientAccountId',
  'requestID',
  // 'requestParameters',
  // 'responseElements',
  'sourceIPAddress',
  'userAgent'
];

var reportUserFields = [
  'accessKeyId',
  'accountId',
  'arn',
  'invokedBy',
  'principalId',
  'type',
  'userName'
];

var convert = function(row) {
  var obj = JSON.parse(row);

  // Remove the array that wraps the objects.
  var records = [];
  obj.Records.forEach(function(record) {
    var event = {};
    // Copy top level fields
    reportFields.forEach(function(key) {
      if (record.hasOwnProperty(key)) {
        event[key] = record[key];
      }
    });
    // Now copy the special userIdentity field
    var userIdentity = {};
    var recordUserId = record.userIdentity;
    reportUserFields.forEach(function(key) {
      if (recordUserId.hasOwnProperty(key)) {
        userIdentity[key] = recordUserId[key];
      }
    });
    event.userIdentity = userIdentity;
    records.push(event);
  });
  return records;
};

module.exports = {
  toJson: convert,
  gzip: true,
  fileDateFormat: 'YYYY/MM/DD',
  reportFields: reportFields
};
