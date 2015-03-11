//#!/usr/bin/env node

// whscmd: a utility for interfacing with the WhiteHat Sentinel API
var program = require('commander');
var _ = require('underscore');
var winston = require('winston');
var logger = new winston.Logger({
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            prettyPrint: true,
            showLevel: true
        })
    ]
});
var cliff = require('cliff');
var httpHelper = require('./httphelper');

// Load up command routers and functions.
var user = require('./user');
var site = require('./site');
var app = require('./app');
var vuln_class = require('./vuln_class');
var vuln_policy = require('./vuln_policy');

var HOST = 'sentinel.whitehatsec.com';
var PORT = 443;

/** Preprocessing step for all commands. 
    @function pre
    @returns {object} Object contain high level options for HTTP to avoid passing around the entire program object. 
**/
function pre() {
    logger.transports.console.level = program.verbosity;
    return {
        host: program.host,
        apikey: program.apikey,
        port: program.port,
    };
}

program.version('0.0.4')
        .option('-v, --verbosity <level>', 'specify output verbosity (verbose|info|warn|error|silent) [error]', 'error')
        .option('-t, --host <host>', 'specify an alternate host [' + HOST + ']', HOST)
        .option('-k, --apikey <apikey>', 'specify the WHS API key. THIS IS REQUIRED.')
        .option('-p, --port <port>', 'specify an alternate port [' + PORT + ']', PORT);

program.command('user <action> [userID]')
    .description(user.description)
    .action(function (action, arg1) {
        var options = pre();        
        return user.route(logger, options, action, arg1);
    });

program.command('site <action> [siteID]')
    .description(site.description)
    .action(function (action, arg1) {
        var options = pre();  
        return site.route(logger, options, action, arg1);      
    });

program.command('app <action> [appID]')
    .description(app.description)
    .action(function (action, arg1) {
        var options = pre();  
        return app.route(logger, options, action, arg1);      
    });

program.command('vuln_class <action> <client_id>')
    .description(vuln_class.description)
    .action(function (action, arg1) {
        var options = pre();  
        return vuln_class.route(logger, options, action, arg1);      
    });

program.command('vuln_policy <action> [arg1] [arg2]')
    .description(vuln_policy.description)
    .action(function (action, arg1, arg2) {
        var options = pre();  
        return vuln_policy.route(logger, options, action, arg1, arg2);      
    });        

program.command('*')
    .action(function (command) {
        var options = pre();
        logger.error("unknown command => " + command);
    });

program.parse(process.argv);

// Print out help if there are no arguments passed in.
if (!program.args.length) 
    program.help();