var https = require('https');
var _ = require('underscore');
/**
 * @module  HTTPHelper
 */

/**
    Generic HTTPGet class.
    @constructor
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post.
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} path - URL to perform the GET on.
    @param {function} formatOutput - callback function to process JSON output
**/
function HTTPGet(logger, config, path, formatOutput) {
    /** @param {object} config - configuration options for the GET. */
    this.config = {
        host: config.host,
        rejectUnauthorized: false,
        port: config.port,
        method: 'GET',
        path: '/' + path + (path.indexOf('?') == -1 ? '?' : '&') + 'key=' + config.apikey
    };

    /** @method HTTPGet.formatOutput - Output formatter to process data and output accordingly
        @param {integer} status - status code from the request
        @param {object} data - data, in JSON format, from the GET 
    **/
    this.formatOutput = formatOutput || function(data) {
        console.log(data);
    };

    /** Execute the get
        @method HTTPGet.execute
        @returns {boolean} true on success, false on error **/
    this.execute = function () {
        var that = this;
        if (!config.apikey) {
            logger.error('must supply an API key option (-k)'); 
            return false;
        }
        var responseData = '';
        logger.verbose('Outbound Headers => ' + JSON.stringify(that.config));
        var clientReq = https.request(that.config, function (clientRes) {
            logger.info('StatusCode => ' + clientRes.statusCode);
            logger.verbose('Response Headers => ' + JSON.stringify(clientRes.headers));

            // Restore the chunks of data to a single string.
            clientRes.on('data', function (chunk) {
                responseData += chunk;
            });

            // Process the end event.
            clientRes.on('end', function () {
                logger.verbose('end received');
                if (!responseData) {
                    logger.error('no data returned');
                } else { 
                    logger.verbose('raw data => ', responseData);
                    that.formatOutput(clientRes.statusCode, responseData);
                }
            });
        }).on('error', function (e) {
            logger.error('problem with https request => ' + e.message);
            return false;
        });
        clientReq.end();
        return true;
    }
}

/**
    Generic HTTPPost class.
    @constructor
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} path - URL to perform the POST on
    @param {function} digestResponse - Callback function to process response data
**/
function HTTPPost(logger, config, path, digestResponse) {

    /** @property {object} config - config associated with the POST */
    this.config = {
        host: config.host,
        rejectUnauthorized: false,
        port: config.port,
        method: 'POST',
        path: '/' + path + (path.indexOf('?') == -1 ? '?' : '&') + 'key=' + config.apikey,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': 0,
            'Accept': 'application/json'
        }
    };

    /** @method HTTPPost.digestResponse - Callback function to process response data
        @param {integer} status - status code from the request
        @param {object} data - data, in JSON format, from the GET 
    **/
    this.digestResponse = digestResponse || function(status, data) {
        console.log("Status %d => %s", status, data);
    };
        
    /** Execute the post
        @method HTTPPost.execute
        @param {object} postData - data to post in JSON format
        @returns {boolean} true on success, false on error **/
    this.execute = function (postData) {
        postData = JSON.stringify(postData);
        var that = this;
        if (!config.apikey) {
            logger.error('must supply an API key option (-k)'); 
            return false;
        }

        that.config.headers["Content-Length"] = postData.length;

        var responseData = '';
        logger.verbose('Outbound Headers => ' + JSON.stringify(that.config));
        var clientReq = https.request(that.config, function (clientRes) {
            logger.info('Status Code => ' + clientRes.statusCode);
            logger.verbose('Response Headers => ' + JSON.stringify(clientRes.headers));

            // Restore the chunks of data to a single string.
            clientRes.on('data', function (chunk) {
                responseData += chunk;
            });

            // Process the end event.
            clientRes.on('end', function () {
                logger.info('end received');
                logger.verbose('raw data => ', responseData);
                that.digestResponse(clientRes.statusCode, responseData);
            });
        }).on('error', function (e) {
            logger.error('problem with https request => ' + e.message);
            return false;
        });

        logger.verbose('Outbound POST Data => ' + postData);
        clientReq.write(postData);
        clientReq.end();
        return true;
    }
}

/**
    Generic HTTPPut class.
    @constructor
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} path - URL to perform the POST on
    @param {function} digestResponse - Callback function to process response data
**/
function HTTPPut(logger, config, path, digestResponse) {

    /** @property {object} config - config associated with the PUT */
    this.config = {
        host: config.host,
        rejectUnauthorized: false,
        port: config.port,
        method: 'PUT',
        path: '/' + path + (path.indexOf('?') == -1 ? '?' : '&') + 'key=' + config.apikey,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': 0,
            'Accept': 'application/json'
        }
    };
 
    /** @method HTTPPost.digestResponse - Callback function to process response data
        @param {integer} status - status code from the request
        @param {object} data - data, in JSON format, from the GET 
    **/
    this.digestResponse = digestResponse || function(status, data) {
        console.log("Status %d => %s", status, data);
    };
        
    /** Execute the post
        @method HTTPPost.execute
        @param {object} putData - data to post in JSON format
        @returns {boolean} true on success, false on error **/
    this.execute = function (putData) {
        putData = JSON.stringify(putData);
        var that = this;
        if (!config.apikey) {
            logger.error('must supply an API key option (-k)'); 
            return false;
        }

        that.config.headers["Content-Length"] = putData.length;

        var responseData = '';
        logger.verbose('Outbound Headers => ' + JSON.stringify(that.config));
        var clientReq = https.request(that.config, function (clientRes) {
            logger.info('Status Code => ' + clientRes.statusCode);
            logger.verbose('Response Headers => ' + JSON.stringify(clientRes.headers));

            // Restore the chunks of data to a single string.
            clientRes.on('data', function (chunk) {
                responseData += chunk;
            });

            // Process the end event.
            clientRes.on('end', function () {
                logger.info('end received');
                logger.verbose('raw data => ', responseData);
                that.digestResponse(clientRes.statusCode, responseData);
            });
        }).on('error', function (e) {
            logger.error('problem with https request => ' + e.message);
            return false;
        });

        logger.verbose('Outbound PUT Data => ' + putData);
        clientReq.write(putData);
        clientReq.end();
        return true;
    }
}

/**
    Generic HTTPDelete class.
    @constructor
    @param {function} logger - logging function (must support verbose, info, etc.)
    @param {object} config - config for the HTTP post
    @param {string} config.host - host to send the request to
    @param {string} config.port - port to send the request to
    @param {string} config.apikey - apikey to use for the request
    @param {string} path - URL to perform the POST on
    @param {function} digestResponse - Callback function to process response data
**/
function HTTPDelete(logger, config, path, digestResponse) {
    /** @property {object} config - config associated with the DELETE */
    this.config = {
        host: config.host,
        rejectUnauthorized: false,
        port: config.port,
        method: 'DELETE',
        path: '/' + path + (path.indexOf('?') == -1 ? '?' : '&') + 'key=' + config.apikey,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': 0,
            'Accept': 'application/json'
        }
    };
        
    /** @method HTTPPost.digestResponse - Callback function to process response data
        @param {integer} status - status code from the request
        @param {object} data - data, in JSON format, from the GET 
    **/
    this.digestResponse = digestResponse || function(status, data) {
        console.log("Status %d => %s", status, data);
    };
        
    /** Execute the post
        @method HTTPDelete.execute
        @returns {boolean} true on success, false on error **/
    this.execute = function () {
        var that = this;
        if (!config.apikey) {
            logger.error('must supply an API key option (-k)'); 
            return false;
        }
        var responseData = '';
        logger.verbose('Outbound Headers => ' + JSON.stringify(that.config));
        var clientReq = https.request(that.config, function (clientRes) {
            logger.info('Status Code => ' + clientRes.statusCode);
            logger.verbose('Response Headers => ' + JSON.stringify(clientRes.headers));

            // Restore the chunks of data to a single string.
            clientRes.on('data', function (chunk) {
                responseData += chunk;
            });

            // Process the end event.
            clientRes.on('end', function () {
                logger.info('End received');
                logger.verbose('raw data => ', responseData);
                that.digestResponse(clientRes.statusCode, responseData);
            });
        }).on('error', function (e) {
            logger.error('problem with https request => ' + e.message);
            return false;
        });

        clientReq.end();
        return true;
    }
}

exports.get = HTTPGet;
exports.post = HTTPPost;
exports.put = HTTPPut;
exports.del = HTTPDelete;