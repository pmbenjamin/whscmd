var _ = require('underscore');
var httpHelper = require('./httphelper');
var cliff = require('cliff');
/**
 * @module user
 */

/** Format and output user information. 
    @function outputUser
    @protected
    @param {array | object} array of user definitions or a single user definition
    @param {array} [keys] - array of key names to print out. Default is ["id", "first_name", "last_name", "username", "company", "role", "client_id"]. 
**/
function outputUsers(users, keys) {
    users = _.isArray(users) ? users : [users];
    keys = keys || ["id", "first_name", "last_name", "username", "company", "role", "client_id"];
    console.log(cliff.stringifyObjectRows(users, keys));
}

/**
    Routing function for user commands
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} action - action to route
    @param {object|string|number} arg1 - variable argument of multiple types depending on the action
    @param {object|string|number} arg2 - variable argument of multiple types depending on the action
**/
function userRoute(logger, config, action, arg1, arg2) {
    switch (action) {
        case "list": 
            return userList(logger, config, arg1);
        break;
        case "delete":
            return userDelete(logger, config, arg1);
        break;
        case "create":
          // Load up the user definition from the supplied file
            if (!_.isString(arg1)) {
                logger.error('missing required path to JSON file containing user definition');
                return false;
            }
    
            var fs = require('fs');
            fs.readFile(arg1, 'utf8', function (err, data) {
                if (err) {  // Error during reading the file.
                    logger.error('reading JSON user file => ' + err);
                    return false;
                }

                try {   // Try to parse the data from the file into JSON.
                    data = JSON.parse(data);
                    return userCreate(logger, config, data);
                 } catch (err) {     // Error during parsing of data.
                    logger.error('parsing apply file => ' + err);
                    return false;
                };
            });  
        break;
        case "update":
             // Load up the custom policy definition from the supplied file
            if (!_.isString(arg2)) {
                logger.error('missing required path to JSON file containing user definition', arg2);
                return false;
            }
                
            var fs = require('fs');
            fs.readFile(arg2, 'utf8', function (err, data) {
                if (err) {  // Error during reading the file.
                    logger.error('reading JSON user file => ' + err);
                    return false;
                }

                try {   // Try to parse the data from the file into JSON.
                    data = JSON.parse(data);
                    return userUpdate(logger, config, arg1, data);
                } catch (err) {     // Error during parsing of data.
                    logger.error('parsing user file => ' + err);
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
                } catch (err) {     // Error during parsing of data.
                    logger.error('parsing return data => ' + err);
                    return false;
                };
                console.log('Listing user%s', data.length == 1 ? '...' : 's...');
                outputUsers(data);
            } else {
                logger.error("%d => %s", status, data.message);
            } 
        };

    var get = new httpHelper.get(logger, config, path, out);
    return get.execute();
}

/**
    Create a new user from the specified json file.
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} user - json object containing the user definition
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function userCreate(logger, config, user, out) {
    // Need to supply a valid user object
    if (!_.isObject(user)) {
        logger.error('user definition is not an object.');
        return false;
    }
    logger.info('User => ', user);
    var path = '/api/user?format=json';

    // Only acceptable type is "sentinel".
    user.type = "sentinel";

    if (!out) {
        console.log("Creating new user...");
        outputUsers(user, _.keys(user));
    }
    
    // Now perform the post.
    var post = new httpHelper.post(logger, config, path, out);
    return post.execute(user);
}

/**
    Update an existing user from the specified json file
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} userID - user to update
    @param {string} user - json object containing the user definition
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function userUpdate(logger, config, userID, user, out) {
    // Need to supply a valid userID
    userID = parseInt(userID);
    if (!_.isNumber(userID) || _.isNaN(userID)) {
        logger.error('missing required user ID');
        return false;
    }
    logger.info('User ID => ' + userID);
    var path = '/api/user/' + userID;

    // Need to supply a valid policy object
    if (!_.isObject(user)) {
        logger.error('user definition is not an object.');
        return false;
    }
    logger.info('User => ' + user);

    if (!out) {
        console.log("Updating user %d...", userID);
        outputUsers([ user ], _.keys(user));
    }
    
    // Now perform the put.
    var put = new httpHelper.put(logger, config, path, out);
    return put.execute(user);
}

/**
    Delete an existing user
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} userID - user to delete
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function userDelete(logger, config, userID, out) {
    // Need to supply a valid policyID
    userID = parseInt(userID);
    if (!_.isNumber(userID) || _.isNaN(userID)) {
        logger.error('missing required user ID');
        return false;
    }
    logger.info('User ID => ' + userID);
    var path = '/api/user/' + userID;

    // Now perform the delete.
    var del = new httpHelper.del(logger, config, path, out);
    return del.execute();
}

exports.description = 'Manage users. Valid actions include: \
    \n\tlist [userID] - list the specified user or all users. \
    \n\tcreate <jsonFile> - create a user from the specified json file \
    \n\tupdate <userID> <jsonFile> - update a user from the specified json file \
    \n\tdelete <userID> - delete the specified user';
exports.route = userRoute;
exports.list = userList;
exports.create = userCreate;
exports.update = userUpdate;
exports.delete = userDelete;