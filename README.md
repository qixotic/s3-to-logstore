[![NPM version](https://badge.fury.io/js/s3-to-logstore.svg)](http://badge.fury.io/js/s3-to-logstore)

Upload AWS log files of various formats (Cloudfront, S3, Cloudtrail) to your log
storage of choice via [Winston](https://github.com/winstonjs/winston) in a
best-effort manner using AWS Lambda and the Node.js v4.3 runtime.

## Motivation

Amazon allows you to log Cloudfront activity or S3 accesses to your buckets, but
only stores them as log objects on S3, sometimes gzipped (as with Cloudfront
logs). While you can set up CloudWatch alerts for e.g. 4xx errors in Cloudfront
traffic, there's no easy way to tail or search these logs to track down issues.
Now with this bit of Lambda glue, you can!

## Example Usage

The module takes the following options and returns a function to serve as our Lambda handler:
* *format* - required, one of: `cloudfront`, `s3`, or `cloudtrail`
* *transport* - required, a [Winston transport](https://github.com/winstonjs/winston/blob/master/docs/transports.md) object.
* *reformatter* - function that takes a json object. If null, the default format is a string of key=value pairs. If you wish to log json, just return the object.
* *callback* - function that takes an error param (may be null) and the Lambda function [handler's callback](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html). If this option is null, we log any error and call the handler's callback.

**[Papertrail demo](examples/papertrail.js)**

**[Loggly demo](examples/loggly.js)**

Test your script using the Lambda console, or run the function locally with
a [test event (step 2.3.2)](http://docs.aws.amazon.com/lambda/latest/dg/with-s3-example-upload-deployment-pkg.html) that points to an object on S3:

```
// To run the code below, `npm install aws-sdk` then:
//   node test.js [lambda_fn_file] test_event.txt
// test.js:
const lambda = require('./' + process.argv[2]);
require('fs').readFile(process.argv[3], (err, data) => {
  if (err) throw err;
  lambda.handler(JSON.parse(data), {}, (err) => {
    if (err) console.log(`Error: ${err}`);
    console.log('Finished.');
  });
});
```

### Notes
* [How to set up an AWS Lambda function with S3](http://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html)
  * First [grant S3 permission to invoke your function](http://docs.aws.amazon.com/lambda/latest/dg/with-s3-example-configure-event-source.html)
  * Then [add S3 as an event source via the S3 console, triggering on PUTs](http://docs.aws.amazon.com/AmazonS3/latest/UG/SettingBucketNotifications.html)
* General docs on [setting up S3 as an event source](http://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html)

#### AWS Lambda from the command line

Ensure that `AWS_SECRET_ACCESS_KEY` and `AWS_ACCESS_KEY_ID` are set in your
environment for an IAM user with permissions to run these functions.

```
# ----- EXAMPLE -----
function=s3LogsToPapertrail
bucket=MY_BUCKET
accountid=MY_ACCOUNT_ID
region=us-west-2
indexname=papertrail

# Zip your js file and modules
zip -r $indexname.zip $indexname.js node_modules/

# Create your lambda function. Assumes you already created an execution role
# (see tutorial).
aws lambda create-function \
  --region $region \
  --function-name $function \
  --zip-file fileb://`pwd`/$indexname.zip \
  --role arn:aws:iam::$accountid:role/lambda-s3-execution-role \
  --handler $indexname.handler \
  --runtime nodejs4.3  \
  --timeout 10 \
  --memory-size 128

# Give S3 permission to invoke this lambda function. 'statement-id' is just
# some unique string.
aws lambda add-permission \
  --function-name $function \
  --region $region \
  --statement-id $function \
  --action "lambda:InvokeFunction" \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::$bucket \
  --source-account $accountid

# Need to update your package?
aws lambda update-function-code \
  --region $region \
  --function-name $function \
  --zip-file fileb://`pwd`/$indexname.zip
```

### Caveats

For a static site hosted on S3 to publish logs to a bucket, the destination
bucket must also be in the same region.  For S3 to post event notifications to
Lambda, the bucket must already be in a [region supported by Lambda](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/).

Therefore your static site must also be hosted in a lambda-supported region.
Currently in the US that is only `us-east-1` and `us-west-2`. Cloudfront
distributions fortunately can log to any S3 bucket, so it's easier to
reconfigure an existing setup to log to one of these regions.

You also can't have event notifications fire to two different lambda functions
for overlapping object prefixes.

Lastly, there isn't any great error handling going on here. E.g. if we're
unable to connect to the transport, we'll lose that object's batch of events.
If you want to be more robust, you'll probably want to incorporate your own
work queue solution.

#### Why "best effort"?

From [Amazon's docs](https://docs.aws.amazon.com/AmazonS3/latest/dev/ServerLogs.html):
```
The completeness and timeliness of server logging, however, is not guaranteed.
The log record for a particular request might be delivered long after the
request was actually processed, or it might not be delivered at all. The
purpose of server logs is to give you an idea of the nature of traffic against
your bucket. It is not meant to be a complete accounting of all requests. It
is rare to lose log records, but server logging is not meant to be a complete
accounting of all requests.
```

## Acknowledgements

Adapted from [WatchKeep](https://github.com/StudioLE/WatchKeep) and inspired by
[convox/papertrail](https://github.com/convox/papertrail); thanks!
