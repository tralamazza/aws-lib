exports.init = function(genericAWSClient) {
  'use strict';

  // Creates an STS API client
  var createSTSClient = function(accessKeyId, secretAccessKey, options) {
    options = options || {};

    var client = new STSClient({
      host: options.host || "sts.amazonaws.com",
      path: options.path || "/",
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: true,
      version: options.version || '2011-06-15'
    });
    return client;
  };

  // Amazon STS API handler which is wrapped around the genericAWSClient
  var STSClient = function(obj) {
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

  return createSTSClient;
};
