exports.init = function(genericAWSClient) {
  'use strict';

  // Creates a Simple Queue Service API client
  var createSQSClient = function(accessKeyId, secretAccessKey, options) {
    options = options || {};
    var client = new SQSClient({
      host: options.host || "sqs.us-east-1.amazonaws.com",
      path: options.path || "/",
      agent: options.agent,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: options.secure,
      version: options.version || '2009-02-01'
    });
    return client;
  };

  // Amazon Simple Queue Service API client
  var SQSClient = function(obj) {
    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure,
      agent:obj.agent
    });

    obj.call = function(action, query, callback) {
      query.Action = action;
      query.Version = obj.version;
      return aws.call(query, callback);
    };

    return obj;
  };

  return createSQSClient;
};
