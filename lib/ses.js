var crypto = require('crypto');

exports.init = function(genericAWSClient) {
  'use strict';

  var createSESClient = function(accessKeyId, secretAccessKey, options) {
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

  var SESClient = function(obj) {
    var processHeader = function(headers, ctx) {
      var sign = crypto.createHmac("sha256", obj.secretAccessKey).update(ctx.now.toUTCString()).digest("base64");
      headers.Date = ctx.now.toUTCString();
      headers['x-amzn-authorization'] =
        "AWS3-HTTPS " +
        "AWSAccessKeyId=" + obj.accessKeyId + ", " +
        "Algorithm=HmacSHA256, " +
        "Signature=" + sign;
    };

    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure,
      processHeader: processHeader
    });

    obj.call = function(action, query, callback) {
      query.Action = action;
      query.Version = obj.version;
      return aws.call(query, callback);
    };

    return obj;
  };

  return createSESClient;
};
