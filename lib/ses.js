exports.init = function (genericAWSClient) {
  'use strict';

  var createSESClient = function (accessKeyId, secretAccessKey, options) {
    options = options || {};
    return new SESClient({
      host: options.host || "email.us-east-1.amazonaws.com",
      path: options.path || "/",
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: true,
      version: options.version || '2010-12-01'
    });
  };

  var SESClient = function (obj) {
    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure,
      addXAMZNAuthorization: true
    });

    obj.call = function(action, query, callback) {
      query["Action"] = action;
      return aws.call(action, query, callback);
    };

    return obj;
  };
  return createSESClient;
};
