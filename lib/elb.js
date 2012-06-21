exports.init = function(genericAWSClient) {
  'use strict';

  // Creates an ELB API client
  var createELBClient = function(accessKeyId, secretAccessKey, options) {
    options = options || {};

    var client = elbClient({
      host: options.host || "elasticloadbalancing.amazonaws.com",
      path: options.path || "/",
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: options.secure,
      version: options.version || '2010-07-01'
    });
    return client;
  };

  // Amazon ELB API handler which is wrapped around the genericAWSClient
  var elbClient = function(obj) {
    var aws = genericAWSClient({
      host: obj.host, path: obj.path, accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey, secure: obj.secure
    });

    obj.call = function(action, query, callback) {
      query.Action = action;
      query.Version = obj.version;
      return aws.call(query, callback);
    };

    return obj;
  };

  return createELBClient;
};
