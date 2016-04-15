var urlUtils = require('url');

/**
 * This function creates a request object
 * by extending given options with auth parameters and host
 */
module.exports.createRequestObject = function createRequestObject(cfg, options) {
  var rootURL = urlUtils.format({
    protocol: 'https',
    host: cfg.host
  });
  var serverURL = rootURL + '/yambas/rest';
  options.uri = serverURL + options.path;
  options.headers = {
    'User-Agent': 'elastic.io',
    'X-apiomat-apikey': cfg.apiKey,
    'X-apiomat-system': cfg["system"]
  };
  // Return and parse JSON
  options.json = true;
  return options;
}
