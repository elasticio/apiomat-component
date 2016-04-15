var Q = require('q');
var rp = require('request-promise');
var urlUtils = require('url');
var util = require('util');

module.exports = verify;

function verify(credentials, cb) {

  console.log('About to verify credentials credentials=%j', credentials);

  var rootURL = urlUtils.format({
    protocol: 'https',
    host: credentials.host
  });

  var serverURL = rootURL + '/yambas/rest';

  function checkHost() {
    console.log('Checking URL url=%s', serverURL);
    return rp(serverURL);
  }

  function checkCredentials(response) {
    console.log('Successfully verified host response=%s', response);
    var path = util.format('/apps/%s/models/Basics/User', credentials.app);
    var options = {
      uri: serverURL + path,
      qs: {
        q: 'limit 1',
        hrefs: false,
        withClassnameFilter: true,
        withReferencedHrefs: false
      },
      headers: {
        'User-Agent': 'elastic.io',
        'X-apiomat-apikey': credentials.apiKey,
        'X-apiomat-system': credentials["system"]
      },
      json: true
    };
    console.log('Sending GET request to url=%s', options.uri);
    return rp(options);
  }

  function failVerification(error) {
    console.log('Verification failed', error);
    cb(error, {verified: false});
  }

  function verificationOk(response) {
    console.log('Verified ok response=', response);
    cb(null, {verified: true});
  }

  Q().then(checkHost).then(checkCredentials).then(verificationOk).fail(failVerification);
}
