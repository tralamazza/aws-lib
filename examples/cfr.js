var aws = require("../lib/aws");
var optimist = require('optimist');
var inspect = require('eyes').inspector({
  maxLength: 1024 * 32
});

var argv = optimist
  .usage('Usage: $0 [--key=<aws key>] [--secret=<aws secret>] [--kpId=<Key-Pair-Id>] [--kpFile=<filename>] COMMAND')
  .check(function() { return optimist.argv._.length > 0; })
  .default('key', process.env.AWS_KEY)
  .describe('key', 'AWS key')
  .default('secret', process.env.AWS_SECRET)
  .describe('secret', 'AWS secret')
  .default('kpId', process.env.AWS_KPID)
  .describe('kpId', 'Cloudfront Key-Pair-Id')
  .default('kpFile', process.env.AWS_KPFILE)
  .describe('kpFile', 'Cloudfront private key file')
  .argv;

var cfront = aws.createCloudFrontClient(argv.key, argv.secret);

if (argv._[0] === 'config') {
  var id = argv._[1];
  cfront.get('/distribution/' + id + '/config', {}, function(err, result, res) {
    inspect(result);
    if (argv._[2]) {
      var oai = argv._[2];
      var etag = res.headers.etag;
      delete result['@'];
      if (result.Origins.Quantity == 0) { console.log('no origins'); exit(1); }
      else if (result.Origins.Quantity == 1) {
        result.Origins.Items.Origin.S3OriginConfig.OriginAccessIdentity = 'origin-access-identity/cloudfront/' + oai;
      }
      var config = { DistributionConfig: result };
      inspect(config);
      cfront.put('/distribution/' + id + '/config', { 'If-Match': etag }, config, function(err, result_put) {
        inspect(result_put);
      });
    }
  });
} else if (argv._[0] === 'distr') {
  if (argv._[1])
    cfront.get('/distribution/' + argv._[1], {}, function(err, result) { inspect(result); });
  else
    cfront.get('/distribution', {}, function(err, result) { inspect(result); });
} else if (argv._[0] === 'origins') {
  if (argv._[1] === 'new') {
    var payload = { CloudFrontOriginAccessIdentityConfig: { CallerReference: +new Date(), Comment: 'aws-lib' } };
    cfront.post('/origin-access-identity/cloudfront', payload, function(err, result) {
      inspect(result);
    });
  } else {
    cfront.get('/origin-access-identity/cloudfront', {}, function(err, result) {
      inspect(result);
      if (argv._[1] === 'clear') {
        cfront.get('/origin-access-identity/cloudfront', {}, function(err, result) {
          inspect(result);

          function remove(id) {
            cfront.get('/origin-access-identity/cloudfront/' + oaid.Id, {}, function(err, rslt_oaid, res) {
              inspect(rslt_oaid);
              cfront.del('/origin-access-identity/cloudfront/' + oaid.Id, { 'If-Match': res.headers.etag }, {}, function(err, rslt_del) {
                inspect(rslt_del);
              });
            });
          }
          if (result.Quantity === 1) // single item
            remove(result.Items.CloudFrontOriginAccessIdentitySummary);
          else if (result.Quantity > 1) // array
            result.Items.CloudFrontOriginAccessIdentitySummary.forEach(function(oaid) { remove(oaid); });
        });
      }
    });
  }
} else if (argv._[0] === 'trusted' && argv._[1]) {
  var id = argv._[1];
  cfront.get('/distribution/' + id + '/config', {}, function(err, result, res) {
    var etag = res.headers.etag;
    var config = {};
    delete result['@'];
    config.DistributionConfig = result;
    config.DistributionConfig.DefaultCacheBehavior.TrustedSigners = {
      Enabled: 'true',
      Quantity: 1,
      Items: { AwsAccountNumber: 'self' }
    };
    cfront.put('/distribution/' + id + '/config', { 'If-Match': etag }, config, function(err, result_put) {
      inspect(result_put);
    });
  });
} else if (argv._[0] === 'sign' && argv._[1]) {
  var in1hour = Math.floor(+new Date() / 1000) + (60 * 60);
  var url = argv._[1];
  var cfr_key = require('fs').readFileSync(argv.kpFile, 'utf-8');

  if (argv._[2]) {
    var cfr_pol = {
      "Statement": [{
        "Resource": "",
        "Condition": {
          "IpAddress": { "AWS:SourceIp": argv._[2] },
          "DateLessThan": { "AWS:EpochTime": in1hour }
        }
      }]
    };
    console.log( cfront.customSignedURL(url, cfr_pol, argv.kpId, cfr_key) );
  } else {
    console.log( cfront.cannedSignedURL(url, in1hour, argv.kpId, cfr_key) );
  }
}
