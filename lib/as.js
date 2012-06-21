exports.init = function(genericAWSClient) {
  'use strict';

  // Creates an AS (Auto Scaling) API client
  var createASClient = function(accessKeyId, secretAccessKey, options) {
    options = options || {};

    var client = new ASClient({
      host: options.host || "autoscaling.amazonaws.com",
      path: options.path || "/",
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: true,
      version: options.version || '2011-01-01'
    });
    return client;
  };

  // Amazon AS API handler which is wrapped around the genericAWSClient
  var ASClient = function(obj) {
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

  return createASClient;
};
