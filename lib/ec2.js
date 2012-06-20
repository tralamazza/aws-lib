exports.init = function(genericAWSClient) {
  'use strict';

  // Creates an EC2 API client
  var createEC2Client = function (accessKeyId, secretAccessKey, options) {
    options = options || {};

    var client = new EC2Client({
      host: options.host || "ec2.amazonaws.com",
      path: options.path || "/",
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: options.secure,
      version: options.version || '2009-11-30'
    });
    return client;
  };

  // Amazon EC2 API handler which is wrapped around the genericAWSClient
  var EC2Client = function(obj) {
    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure
    });

    obj.call = function(action, query, callback) {
      query["Action"] = action;
      query["Version"] = obj.version;
      query["SignatureMethod"] = "HmacSHA256";
      query["SignatureVersion"] = "2";
      return aws.call(action, query, callback);
    };

    return obj;
  };
  return createEC2Client;
};
