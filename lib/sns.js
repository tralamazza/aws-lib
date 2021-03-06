exports.init = function(genericAWSClient) {
  'use strict';

  // Creates a Simple Notification Service API client
  var createSNSClient = function(accessKeyId, secretAccessKey, options) {
    options = options || {};

    var client = new SNSClient({
      host: options.host || "sns.us-east-1.amazonaws.com",
      path: options.path || "/",
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: options.secure,
      version: options.version
    });
    return client;
  };

  // Amazon Simple Notification Service API client
  var SNSClient = function(obj) {
    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure
    });

    obj.call = function(action, query, callback) {
      query.Action = action;
      query.Version = obj.version;
      return aws.call(query, callback);
    };

    return obj;
  };

  return createSNSClient;
};
