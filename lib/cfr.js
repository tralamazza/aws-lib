var js2xml = require('js2xml');

exports.init = function(genericAWSClient) {
  'use strict';

  // Creates a CloudFront API client
  var createCloudFrontClient = function (accessKeyId, secretAccessKey, options) {
    options = options || {};
    return new CloudFrontClient({
      host: options.host || "cloudfront.amazonaws.com",
      path: options.path || "/",
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: true, // HTTPS only
      addStandardAWSSignature: false, // disables normal signature
      addAuthorizationHeader: true, // enables Authorization header
      version: options.version || '2012-05-05'
    });
  };

  // Amazon CloudFront API handler which is wrapped around the genericAWSClient
  var CloudFrontClient = function(obj) {
    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure
    });

    obj.call = function(method, path, query, callback) {
      obj.method = method;
      obj.path = '/' + obj.version + path;
      query.Version = obj.version;
      query.SignatureMethod = "HmacSHA256";
      query.SignatureVersion = "2";
      return aws.call(null, query, callback);
    };

    obj.get = function(path, query, callback) {
      return obj.call('GET', path, query, callback);
    };

    obj.post = function(path, query, callback) {
      return obj.call('POST', path, query, callback);
    };

    obj.put = function(path, query, callback) {
      return obj.call('PUT', path, query, callback);
    };

    obj.del = function(path, query, callback) {
      return obj.call('DELETE', path, query, callback);
    };

    return obj;
  };
  return createCloudFrontClient;
};
