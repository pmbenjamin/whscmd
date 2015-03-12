var _ = require('underscore');
var httpHelper = require('./httphelper');
var cliff = require('cliff');
/**
 * @module user
 */

/**
    Routing function for user commands
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} action - action to route
    @param {object|string|number} arg1 - variable argument of multiple types depending on the action
**/
function userRoute(logger, config, action, arg1) {
    switch (action) {
        case "list": 
            return userList(logger, config, arg1);
        break;
        default:
            logger.error('invalid action => ' + action);
            return false;
        break;
    };
}

/**
    List users or a single user
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} [userID] - user to list. If not specified, list all users
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function userList(logger, config, userID, out) {
    // Optional user ID
    userID = parseInt(userID);
    var path = '/api/user';
    if (!_.isNaN(userID)) {
        logger.info('User ID => ' + userID);
        path += '/' + userID;
    }
    path += '?format=json';

    // Optional out function
    var out = out || function defaultOut(status, data) {
            if (status == 200) {
                try { 
                    data = JSON.parse(data);
                    data = _.isArray(data) ? data : [ data ];
                } catch (err) {     // Error during parsing of data.
                    logger.error('parsing return data => ' + err);
                    return false;
                };
                console.log('Listing user%s', data.length == 1 ? '...' : 's...');
                console.log(cliff.stringifyObjectRows(data, 
                    ["id", "first_name", "last_name", "username", "company", 
                        "role", "client_id"], 
                    ["red", "yellow", "yellow", "yellow", "yellow", "yellow", "blue"]));
            } else {
                logger.error("%d => %s", status, data.message);
            } 
        };

    var get = new httpHelper.get(logger, config, path, out);
    return get.execute();
}

exports.description = 'Manage users. Valid actions include: \
    \n\tlist - list the specified user or all users.';
exports.route = userRoute;
exports.list = userList;