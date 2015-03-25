var _ = require('underscore');
var httpHelper = require('./httphelper');
var cliff = require('cliff');
/**
 * @module  vuln_policy
 */

/** Format and output custom policy information. 
    @function outputCustomPolicies
    @protected
    @param {object} policies 
    @param {boolean} [suppressID] - Suppress the print out of the ID (good for create). 
**/
function outputCustomPolicies(policies, suppressID) {
    suppressID = _.isUndefined(suppressID) ? false : suppressID;
    _.each(policies, function (element, index, list) {
        console.log("Name: %s", element.name);
        if (!suppressID)
            console.log("ID: %d", element.id);
        console.log("Description: %s", element.description);
        console.log("Risk Scores:");
        console.log(cliff.stringifyObjectRows(element.risk_scores, 
            [ "vuln_class_id", "risk_score", "accepted" ], 
            [ "red", "yellow", "yellow", "yellow" ]));

        console.log(" ");
    });
}

/** Format and output custom policy application information. 
    @function outputCustomApplication
    @protected
    @param {object} apply 
**/
function outputCustomApplication(apply) {
    var somethingThere = (apply.sites && apply.sites.length) || 
        (apply.applications && apply.applications.length);
    if (somethingThere) {
        if (apply.sites)
            console.log("Sites: %s", apply.sites);
        if (apply.applications)
            console.log("Apps: %s", apply.applications);
    } else
        console.log("This policy is not applied to any sites or applications.")
}

/**
    Routing function for vuln policy commands
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} action - action to route
    @param {object|string|number} arg1 - variable argument of multiple types depending on the action
    @param {object|string|number} arg2 - variable argument of multiple types depending on the action
**/
function vulnPolicyRoute(logger, config, action, arg1, arg2) {
    switch (action) {
        case "list": 
            return vulnPolicyList(logger, config, arg1);
        break;
        case "create":
            // Load up the custom policy definition from the supplied file
            if (!_.isString(arg1)) {
                logger.error('missing required path to JSON file containing custom scoring policy definition');
                return false;
            }
    
            var fs = require('fs');
            fs.readFile(arg1, 'utf8', function (err, data) {
                if (err) {  // Error during reading the file.
                    logger.error('reading JSON policy file => ' + err);
                    return false;
                }

                try {   // Try to parse the data from the file into JSON.
                    data = JSON.parse(data);
                    return vulnPolicyCreate(logger, config, data);
                } catch (err) {     // Error during parsing of data.
                    logger.error('parsing policy file => ' + err);
                    return false;
                };
            });
        break;        
        case "update":
            // Load up the custom policy definition from the supplied file
            if (!_.isString(arg2)) {
                logger.error('missing required path to JSON file containing policy definition');
                return false;
            }
                
            var fs = require('fs');
            fs.readFile(arg2, 'utf8', function (err, data) {
                console.log("*** HERE ***");
                if (err) {  // Error during reading the file.
                    logger.error('reading JSON policy file => ' + err);
                    return false;
                }

                try {   // Try to parse the data from the file into JSON.
                    data = JSON.parse(data);

                    return vulnPolicyUpdate(logger, config, arg1, data);
                } catch (err) {     // Error during parsing of data.
                    logger.error('parsing policy file => ' + err);
                    return false;
                };
            });
        break;
        case "delete":
            return vulnPolicyDelete(logger, config, arg1);
        break;
        case "apply":
           // Load up the custom policy definition from the supplied file
            if (!_.isString(arg2)) {
                logger.error('missing required path to JSON file containing apply definition');
                return false;
            }
    
            var fs = require('fs');
            fs.readFile(arg2, 'utf8', function (err, data) {
                if (err) {  // Error during reading the file.
                    logger.error('reading JSON apply file => ' + err);
                    return false;
                }

                try {   // Try to parse the data from the file into JSON.
                    data = JSON.parse(data);
                    return vulnPolicyApply(logger, config, arg1, data);
                } catch (err) {     // Error during parsing of data.
                    logger.error('parsing apply file => ' + err);
                    return false;
                };
            });            
        break;
        case "fetch":
            return vulnPolicyFetch(logger, config, arg1);
        break;
        default:
            logger.error('invalid action => ' + action);
            return false;
        break;
    };
}

/**
    List vuln policy for the specified policyID or all policies
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} [policyID] - policy ID to list. If not specified list all policies.
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function vulnPolicyList(logger, config, policyID, out) {
   // Optional vuln policy ID
    policyID = parseInt(policyID);
    var path = '/api/vuln_custom_policy';
    if (!_.isNaN(policyID)) {
        logger.info('Policy ID => ' + policyID);
        path += '/' + policyID;
    }
    path += '?format=json&display_risk_scores=1';

    out = out || function (status, data) {
        if (status == 200) {
            try { 
                data = JSON.parse(data);
                data = _.isArray(data.vuln_custom_policies) ? data.vuln_custom_policies : [ data ];
            } catch (err) {     // Error during parsing of data.
                logger.error('parsing response => ' + err);
                return false;
            };
            console.log('Listing polic%s', data.length == 1 ? 'y...' : 'ies...');
            outputCustomPolicies(data); 
        } else {
            logger.error("%d => %s", status, data);                            
        }        
    }

    var get = new httpHelper.get(logger, config, path, out);
    return get.execute();
}

/**
    Create a vuln policy from the specified json file
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {object } policy - json object containing the policy definition
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function vulnPolicyCreate(logger, config, policy, out) {
    // Need to supply a path to the policy file
    if (!_.isObject(policy)) {
        logger.error('policy definition is not an object');
        return false;
    }
    logger.info('Policy file => ' + JSON.stringify(policy));

    if (!out) {
        console.log("Creating custom policy...");
        outputCustomPolicies([ policy ], true);
    }

    // Now perform the post.
    var post = new httpHelper.post(logger, config, '/api/vuln_custom_policy', out);
    return post.execute(policy);
}

/**
    Update an existing vuln policy from the specified json file
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} policyID - policy to update
    @param {string} policy - json object containing the policy definition
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function vulnPolicyUpdate(logger, config, policyID, policy, out) {
    // Need to supply a valid policyID
    policyID = parseInt(policyID);
    if (!_.isNumber(policyID) || _.isNaN(policyID)) {
        logger.error('missing required policy ID');
        return false;
    }
    logger.info('Policy ID => ' + policyID);
    var path = '/api/vuln_custom_policy/' + policyID;

    // Need to supply a valid policy object
    if (!_.isObject(policy)) {
        logger.error('policy definition is not an object.');
        return false;
    }
    logger.info('Policy => ' + policy);

    if (!out) {
        console.log("Updating custom policy %d...", policyID);
        outputCustomPolicies([ policy ], true);
    }
    
    // Now perform the put.
    var put = new httpHelper.put(logger, config, path, out);
    return put.execute(policy);
}

/**
    Delete an existing vuln policy
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} policyID - policy to delete
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function vulnPolicyDelete(logger, config, policyID, out) {
    // Need to supply a valid policyID
    policyID = parseInt(policyID);
    if (!_.isNumber(policyID) || _.isNaN(policyID)) {
        logger.error('missing required policy ID');
        return false;
    }
    logger.info('Policy ID => ' + policyID);
    var path = '/api/vuln_custom_policy/' + policyID;

    // Now perform the delete.
    var del = new httpHelper.del(logger, config, path, out);
    return del.execute();
}

/**
    Apply an existing vuln policy to a set of sites or applications
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} policyID - policy to update
    @param {object} set - json object containing the list of apps/sites
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function vulnPolicyApply(logger, config, policyID, set, out) {
   // Need to supply a valid policyID
    policyID = parseInt(policyID);
    if (!_.isNumber(policyID) || _.isNaN(policyID)) {
        logger.error('missing required policy ID');
        return false;
    }
    logger.info('Policy ID => ' + policyID);
    var path = '/api/vuln_custom_policy/' + policyID + '/assets';

   // Need to supply a valid set object
    if (!_.isObject(set)) {
        logger.error('set definition is not an object.');
        return false;
    }
    logger.info('Set => ', set);

    if (!out) {
        console.log("Applying custom policy %d...", policyID);
        outputCustomApplication(set);
    }
    
    // Now perform the put.
    var put = new httpHelper.put(logger, config, path, out);
    return put.execute(set);
}

/**
    Fetch a description of how the specified policy is applied.
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} policyID - policy to fetch application descriptionw
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function vulnPolicyFetch(logger, config, policyID, out) {
    // Need to supply a valid policyID
    policyID = parseInt(policyID);
    if (!_.isNumber(policyID) || _.isNaN(policyID)) {
        logger.error('missing required policy ID');
        logger.error('whscmd vuln_policy fetch <policy_id>');
        return false;
    }
    logger.info('Policy ID => ' + policyID);
    var path = '/api/vuln_custom_policy/' + policyID + '/assets?format=json';
 
    out = out || function (status, data) {
        if (status == 200) {
            try {   // Try to parse the data from the file into JSON.
                data = JSON.parse(data);
                console.log("Fetching custom policy %d apply list...", policyID);
                outputCustomApplication(data, true);
            } catch (err) {     // Error during parsing of data.
                logger.error('parsing policy file => ' + err);
                return false;
            };
        } else {
            logger.error("%d => %s", status, data.message);                            
        }
    };

    var get = new httpHelper.get(logger, config, path, out);
    return get.execute();
}

exports.description = 'Manage custom scoring policies. Valid actions include: ' +
    '\n\tlist [policy_id] - list the specified scoring policy or policies' + 
    '\n\tcreate <json_file> - create a policy from the specified json file' + 
    '\n\tupdate <policy_id> <json_file> - update an existing policy' +
    '\n\tdelete <policy_id> - delete the specified policy' +
    '\n\tapply <policy_id> <json_file> - apply the policy to sites and apps specified in the json file' +
    '\n\tfetch <policy_id> - fetch the lists of sites/apps where this policy has been applied.';
exports.route = vulnPolicyRoute;
exports.list = vulnPolicyList;
exports.create = vulnPolicyCreate;
exports.update = vulnPolicyUpdate;
exports.delete = vulnPolicyDelete;
exports.apply = vulnPolicyApply;
exports.fetch = vulnPolicyFetch;