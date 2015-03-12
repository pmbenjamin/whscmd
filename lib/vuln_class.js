var _ = require('underscore');
var httpHelper = require('./httphelper');
var cliff = require('cliff');
/**
 * @module  vuln_class
 */

/**
    Routing function for vuln class commands
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} action - action to route
    @param {object|string|number} arg1 - variable argument of multiple types depending on the action
**/
function vulnClassRoute(logger, config, action, arg1) {
    switch (action) {
        case "list": 
            return vulnClassList(logger, config, arg1);
        break;
        default:
            logger.error('invalid action => ' + action);
            return false;
        break;
    };
}

/**
    List vuln classes for the specified clientID
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} clientID - client ID to list vuln classes for
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function vulnClassList(logger, config, clientID, out) {
    // Need to supply a valid client ID
    clientID = parseInt(clientID);
    if (_.isNaN(clientID)) {
        logger.error('missing required client ID');
        logger.error('whscmd vuln_class list <client_id>');
        return false;
    }
    var path = '/api/' + clientID + '/vuln_policy/all_vuln_classes?format=json';

    // Optional out function
    var out = out || function defaultOut(status, data) {
        if (status == 200) {
            try { 
                data = JSON.parse(data);
            } catch (err) {     // Error during parsing of data.
                logger.error('parsing return data => ' + err);
                return false;
            };
            console.log(cliff.stringifyObjectRows(data.all_vuln_classes, 
                [ "id", "shortname", "name" ], 
                [ "red", "yellow", "yellow" ]));
        } else {
            logger.error("%d => %s", status, data);                            
        }      
    };

    var get = new httpHelper.get(logger, config, path, out);
    return get.execute();
}

exports.description = 'Manage vuln classes. Valid actions include: \
    \n\tlist - list all vulnerability classes for the specified client ID.';
exports.route = vulnClassRoute;
exports.list = vulnClassList;