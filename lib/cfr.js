var crypto = require('crypto');
var Js2Xml = require('js2xml').Js2Xml;
var qs = require('querystring');

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
      version: options.version || '2012-05-05'
    });
  };

  // Amazon CloudFront API handler which is wrapped around the genericAWSClient
  var CloudFrontClient = function(obj) {

    var processHeader = function(headers, ctx) {
      // cloudfront sha1 Authorization header
      var auth_sign = crypto.createHmac("sha1", obj.secretAccessKey).update(ctx.now.toUTCString()).digest("base64");
      headers.Authorization = 'AWS ' + obj.accessKeyId + ":" + auth_sign;
      headers.Date = ctx.now.toUTCString();
      if (ctx.headers) // XXX ugly hack to pass etag in 'if-match'
        for (var p in ctx.headers)
          headers[p] = ctx.headers[p];
      return headers;
    };

    var processBody = function(query, ctx) {
      var keys = Object.keys(query);
      if (keys.length === 0)
        return '';
      else {
        // first key/property becomes the root xml element
        var js2xml = new Js2Xml(keys[0], query[keys[0]]);
        return js2xml.toString();
      }
    };

    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure,
      processHeader: processHeader,
      processBody: processBody
    });

    var call = function(method, path, headers, query, callback) {
      aws.method = method;
      aws.path = '/' + obj.version + path;
      return aws.call(query, callback, { headers: headers });
    };

    obj.get = function(path, query, callback) {
      return call('GET', path, null, query, callback);
    };

    obj.post = function(path, query, callback) {
      return call('POST', path, null, query, callback);
    };

    obj.put = function(path, headers, query, callback) {
      return call('PUT', path, headers, query, callback);
    };

    obj.del = function(path, headers, query, callback) {
      return call('DELETE', path, headers, query, callback);
    };

    obj.customSignedURL = function(url, policy, keyPairId, key) {
      policy.Statement[0].Resource = url;
      var data = JSON.stringify(policy);
      var dataB = new Buffer(data);
      var sign = crypto.createSign('RSA-SHA1')
        .update(data)
        .sign(key, 'base64')
        .replace(/\+/g, '-')
        .replace(/\=/g, '_')
        .replace(/\//g, '~');
      var result = {
        Policy: dataB.toString('base64'),
        Signature: sign,
        'Key-Pair-Id': keyPairId
      };
      return url + (url.match(/\?/) ? '&' : '?') + qs.stringify(result);
    };

    obj.cannedSignedURL = function(url, expiresEpoch, keyPairId, key) {
      var policy = {
        Statement: [{
          Resource: url,
          Condition: { DateLessThan: { 'AWS:EpochTime': expiresEpoch } }
        }]
      };
      var data = JSON.stringify(policy);
      var sign = crypto.createSign('RSA-SHA1')
        .update(data)
        .sign(key, 'base64')
        .replace(/\+/g, '-')
        .replace(/\=/g, '_')
        .replace(/\//g, '~');
      var result = {
        Expires: expiresEpoch,
        Signature: sign,
        'Key-Pair-Id': keyPairId
      };
      return url + (url.match(/\?/) ? '&' : '?') + qs.stringify(result);
    };

    return obj;
  };

  return createCloudFrontClient;
};
