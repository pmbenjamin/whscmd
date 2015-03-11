var _ = require('underscore');
var httpHelper = require('./httphelper');
var cliff = require('cliff');

/**
    Routing function for site commands
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} action - action to route
    @param {object|string|number} arg1 - variable argument of multiple types depending on the action
**/
function siteRoute(logger, config, action, arg1) {
    switch (action) {
        case "list": 
            return siteList(logger, config, arg1);
        break;
        default:
            logger.error('invalid action => ' + action);
            return false;
        break;
    };
}

/**
    List sites or a single site
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} [siteID] - site to list. If not specified, list all sites
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function siteList(logger, config, siteID, out) {
    // Optional site ID
    siteID = parseInt(siteID);
    var path = '/api/site';
    if (!_.isNaN(siteID)) {
        logger.info('Site ID => ' + siteID);
        path += '/' + siteID;
    }
    path += '?format=json&display_scan_status=1';

    // Optional out function
    var out = out || function defaultOut(status, data) {
        if (status == 200) {
            try { 
                data = JSON.parse(data);
                data = _.isArray(data.sites) ? data.sites : [ data ];
            } catch (err) {     // Error during parsing of data.
                logger.error('parsing return data => ' + err);
                return false;
            };
            console.log('Listing site%s', data.length == 1 ? '...' : 's...');
            console.log(cliff.stringifyObjectRows(data, 
                [ "id", "label", "scan_status" ], 
                [ "red", "yellow", "yellow" ]));
        } else {
            logger.error("%d => %s", status, data);
        }
    };

    var get = new httpHelper.get(logger, config, path, out);
    return get.execute();
}

exports.description = 'Manage sites. Valid actions include: \
    \n\tlist - list the specified site or all sites.';
exports.route = siteRoute;
exports.list = siteList;