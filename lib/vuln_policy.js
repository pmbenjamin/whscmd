var _ = require('underscore');
var httpHelper = require('./httphelper');
var cliff = require('cliff');

/** Format and output custom policy information. 
    @function outputCustomPolicies
    @private
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
    @private
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
        console.log("This policy has not been applied to any sites or applications.")
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
            return vulnPolicyCreate(logger, config, arg1);
        break;
        case "update":
            return vulnPolicyUpdate(logger, config, arg1, arg2);
        break;
        case "delete":
            return vulnPolicyDelete(logger, config, arg1);
        break;
        case "apply":
            return vulnPolicyApply(logger, config, arg1, arg2);
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
    @param {string} <jsonFile> - local json file containing the policy definition.
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function vulnPolicyCreate(logger, config, jsonFile, out) {
    // Need to supply a path to the policy file
    if (!_.isString(jsonFile)) {
        logger.error('missing required path to JSON file containing custom scoring policy definition.');
        return false;
    }
    logger.info('Policy file => ' + jsonFile);

    // Load up the custom policy definition from the supplied file
    var fs = require('fs');
    fs.readFile(jsonFile, 'utf8', function (err, data) {
        if (err) {  // Error during reading the file.
            logger.error('reading JSON policy file => ' + err);
            return false;
        }

        try {   // Try to parse the data from the file into JSON.
            data = JSON.parse(data);
            if (!out) {
                console.log("Creating custom policy...");
                outputCustomPolicies([ data ], true);
            }
        } catch (err) {     // Error during parsing of data.
            logger.error('parsing policy file => ' + err);
            return false;
        };
        
        // Now perform the post.
        var post = new httpHelper.post(logger, config, '/api/vuln_custom_policy', out);
        return post.execute(data);
    });
}

/**
    Update an existing vuln policy from the specified json file
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} <policyID> - policy to update
    @param {string} <jsonFile> - local json file containing the policy definition
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function vulnPolicyUpdate(logger, config, policyID, jsonFile, out) {
    // Need to supply a valid policyID
    policyID = parseInt(policyID);
    if (!_.isNumber(policyID) || _.isNaN(policyID)) {
        logger.error('missing required policy ID');
        return false;
    }
    logger.info('Policy ID => ' + policyID);
    var path = '/api/vuln_custom_policy/' + policyID;

    // Need to supply a path to the policy file
    if (!_.isString(jsonFile)) {
        logger.error('missing required path to JSON file containing custom scoring policy definition.');
        return false;
    }
    logger.info('Policy file => ' + jsonFile);

    // Load up the custom policy definition from the supplied file
    var fs = require('fs');
    fs.readFile(jsonFile, 'utf8', function (err, data) {
        if (err) {  // Error during reading the file.
            logger.error('reading JSON policy file => ' + err);
            return false;
        }

        try {   // Try to parse the data from the file into JSON.
            data = JSON.parse(data);
            if (!out) {
                console.log("Updating custom policy %d...", policyID);
                outputCustomPolicies([ data ], true);
            }
        } catch (err) {     // Error during parsing of data.
            logger.error('parsing policy file => ' + err);
            return false;
        };
        
        // Now perform the put.
        var put = new httpHelper.put(logger, config, path, out);
        return put.execute(data);
    });
}

/**
    Delete an existing vuln policy
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} <policyID> - policy to delete
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
    @param {number} <policyID> - policy to update
    @param {string} <jsonFile> - local json file containing the list of apps/sites
    @param {function} [out] - output processing function. If not specified, dump to console
**/
function vulnPolicyApply(logger, config, policyID, jsonFile, out) {
   // Need to supply a valid policyID
    policyID = parseInt(policyID);
    if (!_.isNumber(policyID) || _.isNaN(policyID)) {
        logger.error('missing required policy ID');
        return false;
    }
    logger.info('Policy ID => ' + policyID);
    var path = '/api/vuln_custom_policy/' + policyID + '/assets';

    // Need to supply a path to the list of sites/applications
    if (!_.isString(jsonFile)) {
        logger.error('missing required path to JSON file containing list of sites and applications to apply this policy to.');
        return false;
    }
    logger.info('Apply file => ' + jsonFile);

    // Load up the custom policy definition from the supplied file
    var fs = require('fs');
    fs.readFile(jsonFile, 'utf8', function (err, data) {
        if (err) {  // Error during reading the file.
            logger.error('reading JSON apply file => ' + err);
            return false;
        }

        try {   // Try to parse the data from the file into JSON.
            data = JSON.parse(data);
            if (!out) {
                console.log("Applying custom policy %d...", policyID);
                outputCustomApplication(data);
            }
        } catch (err) {     // Error during parsing of data.
            logger.error('parsing policy application file => ' + err);
            return false;
        };
        
        // Now perform the put.
        var put = new httpHelper.put(logger, config, path, out);
        return put.execute(data);
    });
}

/**
    Fetch a description of how the specified policy is applied.
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {number} <policyID> - policy to fetch application descriptionw
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