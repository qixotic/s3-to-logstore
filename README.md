Upload AWS log files of various formats (Cloudfront, S3, Cloudtrail) to your log storage of choice
via [Winston](https://github.com/winstonjs/winston) in a best-effort manner. Adapted from
[WatchKeep](https://github.com/StudioLE/WatchKeep) and
[convox/papertrail](https://github.com/convox/papertrail); thanks!

## Motivation

Amazon allows you to log Cloudfront activity or S3 accesses to your buckets, but only stores them as
log objects on S3, sometimes gzipped (as with Cloudfront logs). While you can set up CloudWatch
alerts for e.g. 4xx errors in Cloudfront traffic, there's no easy way to tail or search these logs
to track down issues. Now with this bit of Lambda glue, you can!


## Example Usage

### Papertrail demo

```
$ npm install s3-to-logstore winston winston-papertrail
```

```
### index.js ###

var S3ToLogstore = require('s3-to-logstore');
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

exports.handler = S3ToLogstore(format, transport);
```

```
$ zip -r lambda.zip index.js node_modules/
# Now upload the code to your Lambda function via the AWS console or command line.
```

### Loggly demo

```
$ npm install s3-to-logstore winston winston-loggly
```

```
### index.js ###

var S3ToLogstore = require('s3-to-logstore');
var winston = require('winston');
require('winston-loggly');

var format = 'cloudfront';
var transport = new winston.transports.Loggly({
  token: "<TOKEN>",
  subdomain: "<SUBDOMAIN>",
  tags: [format],
  isBulk: true
});

exports.handler = S3ToLogstore(format, transport);
```

### Notes
* For more transports, see https://github.com/winstonjs/winston/blob/master/docs/transports.md
* How to set up an AWS Lambda function with S3:
http://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html
  * Adding an event source to your Lambda function: http://docs.aws.amazon.com/lambda/latest/dg/with-s3-example-configure-event-source.html
* http://docs.aws.amazon.com/AmazonS3/latest/UG/SettingBucketNotifications.html
* General docs on setting up S3 as an event source:
http://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html


### Caveats

For a static site hosted on S3 to publish logs to a bucket, the destination bucket must also be in
the same region.  For S3 to post event notifications to Lambda, the bucket must already be in a
region supported by Lambda:
https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/

Therefore your static site must also be hosted in a lambda-supported region. Currently in the US
that is only `us-east-1` and `us-west-2`. Cloudfront distributions fortunately can log to any S3
bucket, so it's easier to reconfigure an existing setup to log to one of these regions.

You also can't have event notifications fire to two different lambda functions for overlapping
object prefixes.


#### Why "best effort"?

From [Amazon's docs](https://docs.aws.amazon.com/AmazonS3/latest/dev/ServerLogs.html):
```
The completeness and timeliness of server logging, however, is not guaranteed. The log record for a
particular request might be delivered long after the request was actually processed, or it might not
be delivered at all. The purpose of server logs is to give you an idea of the nature of traffic
against your bucket. It is not meant to be a complete accounting of all requests. It is rare to lose
log records, but server logging is not meant to be a complete accounting of all requests.
```
