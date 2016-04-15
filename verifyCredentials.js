var q = require('q');
var rp = require('request-promise');
var url = require('url');

module.exports = verify;

function verify(credentials, cb) {

  console.log('About to verify credentials credentials=%j', credentials);

  function checkHost(credentials) {
    var url = url.format({
      protocol: 'https',
      host: credentials.host
    });
    console.log('Checking URL url=%s', url);
    return rp(url);
  }

  function failVerification(error) {
    console.log('Verification failed', error);
    cb(error, {verified: false});
  }

  function verificationOk() {
    console.log('Successfully verified credentials');
    cb(null, {verified: true});
  }

  Q(checkHost).then(verificationOk).fail(failVerification);
}
