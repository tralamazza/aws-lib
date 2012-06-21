exports.init = function(genericAWSClient) {
  'use strict';

  //creates an Amazon Product Advertising API Client
  var createProdAdvClient = function (accessKeyId, secretAccessKey, associateTag, options) {
    options = options || {};

    var client = prodAdvClient({
      host: options.host || "ecs.amazonaws.com",
      path: options.path || "/onca/xml",
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      associateTag: associateTag,
      secure: options.secure,
      version: options.version || '2009-10-01',
      region: options.region || "US"
    });
    return client;
  };

  // Amazon Product Advertising API handler which is wrapped around the genericAWSClient
  var prodAdvClient = function(obj) {
    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure
    });

    obj.call = function(action, query, callback) {
      query.Operation = action;
      query.Service = "AWSECommerceService";
      query.Version = obj.version;
      query.AssociateTag = obj.associateTag;
      query.Region = obj.region;
      return aws.call(query, callback);
    };

    return obj;
  };

  return createProdAdvClient;
};
