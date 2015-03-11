var _ = require('underscore');
var httpHelper = require('./httphelper');
var cliff = require('cliff');

/**
    Routing function for app commands
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} action - action to route
    @param {object|string|number} arg1 - variable argument of multiple types depending on the action
**/
function appRoute(logger, config, action, arg1) {
    switch (action) {
        case "list": 
            return appList(logger, config, arg1);
        break;
        default:
            logger.error('invalid action => ' + action);
            return false;
        break;
    };
}

/**
    List applications or a single application
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} [appID] - application to list. If not specified, list all applications
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function appList(logger, config, appID, out) {
    // Optional app ID
    appID = parseInt(appID);
    var path = '/api/application';
    if (!_.isNaN(appID)) {
        logger.info('App ID => ' + appID);
        path += '/' + appID;
    }
    path += '?format=json';

    // Optional out function
    var out = out || function defaultOut(status, data) {
        if (status == 200) {
            try { 
                data = JSON.parse(data); 
                data = _.isArray(data.collection) ? data.collection : [ data ];
            } catch (e) { 
                logger.error('problem parsing return data => ' + e.message);
                return false;
            }
            console.log('Listing application%s', data.length == 1 ? '...' : 's...');
            console.log(cliff.stringifyObjectRows(data, 
                [ "id", "label", "language", "status" ], 
                [ "red", "yellow", "yellow", "yellow" ]));
        } else {
            logger.error("%d => %s", status, data);
            return false;
        } 
        return true;
    };

    var get = new httpHelper.get(logger, config, path, out);
    return get.execute();
}

exports.description = 'Manage apps. Valid actions include: \
    \n\tlist - list the specified app or all app.';
exports.route = appRoute;
exports.list = appList;