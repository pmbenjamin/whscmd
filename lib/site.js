var _ = require('underscore');
var httpHelper = require('./httphelper');
var cliff = require('cliff');
/**
 * @module  site
 */

/** Format and output site information. 
    @function outputSites
    @protected
    @param {array | object} array of site definitions or a single site definition
    @param {array} [keys] - array of key names to print out. Default is ["id", "label", "scan_status"]. 
**/
function outputSites(sites, keys) {
    sites = _.isArray(sites) ? sites : [sites];
    keys = keys || ["id", "label", "scan_status"];
    console.log(cliff.stringifyObjectRows(sites, keys));
 }

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
        case "entry_points":
            return siteEntryPoints(logger, config, arg1);
        break;
        case "create":
          // Load up the user definition from the supplied file
            if (!_.isString(arg1)) {
                logger.error('missing required path to JSON file containing site definition');
                return false;
            }
    
            var fs = require('fs');
            fs.readFile(arg1, 'utf8', function (err, data) {
                if (err) {  // Error during reading the file.
                    logger.error('reading JSON site file => ' + err);
                    return false;
                }

                try {   // Try to parse the data from the file into JSON.
                    data = JSON.parse(data);
                    return siteCreate(logger, config, data);
                 } catch (err) {     // Error during parsing of data.
                    logger.error('parsing JSON site file => ' + err);
                    return false;
                };
            });  
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
    path += '?format=json&display_all=1';

    // Optional out function
    var out = out || function defaultOut(status, data) {
        if (status == 200) {
            try { 
                data = JSON.parse(data);
            } catch (err) {     // Error during parsing of data.
                logger.error('parsing return data => ' + err);
                return false;
            };
            console.log('Listing site%s', data.sites.length == 1 ? '...' : 's...');
            outputSites(data.sites);
        } else {
            logger.error("%d => %s", status, data);
        }
    };

    var get = new httpHelper.get(logger, config, path, out);
    return get.execute();
}

/**
    List entry points for a site
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} <siteID> - site to list entry points for.
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function siteEntryPoints(logger, config, siteID, out) {
    // Optional site ID
    siteID = parseInt(siteID);
    var path = '/api/site';
    if (_.isNaN(siteID)) {
        logger.error("missing required siteID");
        return false;
    }
    logger.info('Site ID => ' + siteID);
    path += '/' + siteID;
    path += '/entry_points?format=json&display_all=1';

    // Optional out function
    var out = out || function defaultOut(status, data) {
        if (status == 200) {
            try { 
                data = JSON.parse(data);
            } catch (err) {     // Error during parsing of data.
                logger.error('parsing return data => ' + err);
                return false;
            };

            if (!data.entry_points.length) {
                console.log('Site %d has no entry points', siteID);
            } else {
                console.log('Listing site entry points for site %d...', siteID);
                data = _.isArray(data.entry_points) ? data.entry_points : [data.entry_points];
                console.log(cliff.stringifyObjectRows(data, [ "id", "method", "uri" ]));
            }
        } else {
            logger.error("%d => %s", status, data);
            return false;
        }
        return true;
    };

    var get = new httpHelper.get(logger, config, path, out);
    return get.execute();
}

/**
    Create a new site from the specified json object.
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} site - json object containing the site definition
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function siteCreate(logger, config, site, out) {
    // Need to supply a valid site object
    if (!_.isObject(site)) {
        logger.error('site definition is not an object.');
        return false;
    }
    logger.info('Site => ', site);
    var path = '/api/site?format=json';

     if (!out) {
        console.log("Creating new site...");
        outputSites(site, _.keys(site));
    }
    
    // Now perform the post.
    var post = new httpHelper.post(logger, config, path, out);
    return post.execute(site);
}

exports.description = 'Manage sites. Valid actions include: \
    \n\tlist [siteID] - list the specified site or all sites. \
    \n\tcreate <jsonFile> - create a site from the specified json file. \
    \n\tentry_points <siteID> - list entry points for the specified site.';
exports.route = siteRoute;
exports.list = siteList;
exports.create = siteCreate;
exports.entryPoints = siteEntryPoints;