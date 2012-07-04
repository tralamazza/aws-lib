var http = require("http");
var https = require("https");
var qs = require("querystring");
var crypto = require("crypto");
var events = require("events");
var xml2js = require("xml2js");

// include specific API clients
var ec2 = require("./ec2");
var prodAdv = require("./prodAdv");
var simpledb = require("./simpledb");
var sqs = require("./sqs");
var sns = require("./sns");
var ses = require("./ses");
var as = require("./as");
var elb = require("./elb");
var iam = require("./iam");
var sts = require("./sts");
var cw = require("./cw");
var cfr = require("./cfr");

// a generic AWS API Client which handles the general parts
var genericAWSClient = function(obj) {
  'use strict';

  obj.method = obj.method || 'POST';

  // return a header object
  var defaultHeader = function(headers, ctx) {
    headers['Content-Type'] = "application/x-www-form-urlencoded; charset=utf-8";
    return headers;
  };

  // creates a body (should return a string)
  var defaultBody = function(query, ctx) {
    // Add the standard parameters required by most AWS APIs
    query.SignatureMethod = 'HmacSHA256';
    query.SignatureVersion = '2';
    query.Timestamp = ctx.now.toISOString();
    query.AWSAccessKeyId = obj.accessKeyId;
    query.Signature = obj.sign(query);
    return qs.stringify(query);
  };

  obj.processHeader = obj.processHeader || defaultHeader;
  obj.processBody = obj.processBody || defaultBody;

  if (typeof obj.secure !== 'boolean')
    obj.secure = true;
  obj.connection = obj.secure ? https : http;

  obj.call = function(query, callback, context) {
    if (obj.secretAccessKey == null || obj.accessKeyId == null) {
      throw("secretAccessKey and accessKeyId must be set");
    }

    if (typeof context !== 'undefined')
      context.now = new Date();
    else
      context = { now: new Date() };

    var body = obj.processBody(query, context);

    var headers = obj.processHeader({
      'Host': obj.host,
      'Content-Length': body.length
    }, context);

    var options = {
      host: obj.host,
      path: obj.path,
      agent: obj.agent,
      method: obj.method,
      headers: headers
    };

    var req = obj.connection.request(options, function (res) {
      var data = '';
      //the listener that handles the response chunks
      res.addListener('data', function (chunk) {
        data += chunk.toString();
      });
      res.addListener('end', function() {
        var parser = new xml2js.Parser();
        parser.addListener('end', function(result) {
          if (result && typeof result.Errors !== 'undefined') {
            callback(result.Errors.Error.Message, result, res);
          } else {
            callback(null, result, res);
          }
        });
        parser.parseString(data);
      });
    });
    req.write(body);
    req.end();
  };

  /*
    Calculate HMAC signature of the query
  */
  obj.sign = function (query) {
    var keys = [];
    var sorted = {};

    for(var k in query)
      keys.push(k);

    keys = keys.sort();

    for(var n in keys) {
      var kn = keys[n];
      sorted[kn] = query[kn];
    }
    var stringToSign = [obj.method, obj.host, obj.path, qs.stringify(sorted)].join("\n");

    // Amazon signature algorithm seems to require this
    stringToSign = stringToSign.replace(/!/g,"%21");
    stringToSign = stringToSign.replace(/'/g,"%27");
    stringToSign = stringToSign.replace(/\*/g,"%2A");
    stringToSign = stringToSign.replace(/\(/g,"%28");
    stringToSign = stringToSign.replace(/\)/g,"%29");

    return crypto.createHmac("sha256", obj.secretAccessKey).update(stringToSign).digest("base64");
  };
  return obj;
};

exports.createEC2Client = ec2.init(genericAWSClient);
exports.createProdAdvClient = prodAdv.init(genericAWSClient);
exports.createSimpleDBClient = simpledb.init(genericAWSClient);
exports.createSQSClient = sqs.init(genericAWSClient);
exports.createSNSClient = sns.init(genericAWSClient);
exports.createSESClient = ses.init(genericAWSClient);
exports.createELBClient = elb.init(genericAWSClient);
exports.createASClient = as.init(genericAWSClient);
exports.createIAMClient = iam.init(genericAWSClient);
exports.createSTSClient = sts.init(genericAWSClient);
exports.createCWClient = cw.init(genericAWSClient);
exports.createCloudFrontClient = cfr.init(genericAWSClient);
