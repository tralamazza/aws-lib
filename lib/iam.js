exports.init = function(genericAWSClient) {
  'use strict';

  // Creates an IAM API client
  var createIAMClient = function(accessKeyId, secretAccessKey, options) {
    options = options || {};

    var client = iamClient({
      host: options.host || "iam.amazonaws.com",
      path: options.path || "/",
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: true,
      version: options.version || '2010-05-08'
    });
    return client;
  };

  // Amazon IAM API handler which is wrapped around the genericAWSClient
  var iamClient = function(obj) {
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

  return createIAMClient;
};
