/* eslint new-cap: [2, {"capIsNewExceptions": ["Q"]}] */
var Q = require('q');
var elasticio = require('elasticio-node');
var messages = elasticio.messages;
var rp = require('request-promise');
var authUtils = require('../utils.js');
var util = require('util');


module.exports.process = processAction;
module.exports.getMetaModel = getMetaModel;
module.exports.getModules = getModules;
module.exports.getModels = getModels;

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
function processAction(msg, cfg) {
  var self = this;
  var name = cfg.name;

  function emitData() {
    console.log('About to say hello to ' + name + ' again');

    var body = {
      greeting: name + ' How are you today?',
      originalGreeting: msg.body.greeting
    };

    var data = messages.newMessageWithBody(body);

    self.emit('data', data);
  }

  function emitError(e) {
    console.log('Oops! Error occurred');

    self.emit('error', e);
  }

  function emitEnd() {
    console.log('Finished execution');

    self.emit('end');
  }

  Q().then(emitData).fail(emitError).done(emitEnd);
}

/**
 * This function is called at design time when dynamic metadata need
 * to be fetched from 3rd party system
 *
 * @param cfg - configuration object same as in process method above
 * @param cb - callback returning metadata
 */
function getMetaModel(cfg, cb) {
  console.log('Fetching metadata with following configuration cfg=%j', cfg);

  /**
   * Filter out attributes we can't handle currently
   * @param attribute
   */
  function filterAttribute(attribute) {
    if (attribute.readOnly) return false;
    if (attribute.isCollection || attribute.isReference) return false;
    if (attribute.deprecated) return false;
    return true;
  }

  function fetchModels() {
    var options = authUtils.createRequestObject(cfg, {
      path: '/modules/' + cfg.module + '/metamodels/' + cfg.model + '/attributes'
    });
    console.log('Sending GET request to url=%s', options.uri);
    return rp(options);
  }

  function transformResults(response) {
    console.log('Have got response=%j', response);
    if (!response || !response.map) throw new Error('Have got invalid response, expected array');
    var result = {
      type: 'object',
      properties: {}
    };
    response.filter(filterAttribute).map(function transform(attribute) {
      result.properties[attribute.name] = {
        type: attribute.type,
        require: attribute.isMandatory,
        title: attribute.capitalizedName
      }
    });
    cb(null, {
      in:  result,
      out: {
        type: "object",
        properties: {
          outValue: {
            type: "string",
            required: true,
            title: "Output Value"
          }
        }
      }
    });
  }

  Q().then(fetchModels).then(transformResults).fail(function fetchFailed(error) {
    return cb(error);
  });
}

/**
 * This functions returns a selection model for available Modules
 *
 * @param cfg
 * @param cb
 */
function getModules(cfg, cb) {
  function fetchModules() {
    var options = authUtils.createRequestObject(cfg, {
      path: '/modules/',
      qs: {
        checkHasConfig: false
      },
    });
    console.log('Sending GET request to url=%s', options.uri);
    return rp(options);
  }

  function transformResults(response) {
    console.log('Have got response=%j', response);
    var result = {};
    if (!response || !response.map) throw new Error('Have got invalid response, expected array');
    response.map(function transform(module) {
      result[module.name] = module.name;
    });
    cb(null, result);
  }

  Q().then(fetchModules).then(transformResults).fail(function fetchFailed(error) {
    return cb(error);
  });
}


/**
 * This functions returns a selection model for available Models
 *
 * @param cfg
 * @param cb
 */
function getModels(cfg, cb) {

  if (!cfg.module) {
    return cb('Module is not yet set, please chose Module first');
  }

  function fetchModels() {
    var options = authUtils.createRequestObject(cfg, {
      path: '/modules/' + cfg.module + '/metamodels'
    });
    console.log('Sending GET request to url=%s', options.uri);
    return rp(options);
  }

  function transformResults(response) {
    console.log('Have got response=%j', response);
    var result = {};
    if (!response || !response.map) throw new Error('Have got invalid response, expected array');
    response.map(function transform(model) {
      result[model.id] = model.name;
    });
    cb(null, result);
  }

  Q().then(fetchModels).then(transformResults).fail(function fetchFailed(error) {
    return cb(error);
  });
}
