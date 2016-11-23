#!/usr/bin/env node

// whscmd: a utility for interfacing with the WhiteHat Sentinel API
var httpHelper = require('../lib/httphelper');
var program = require('commander');
var _ = require('underscore');
var winston = require('winston');
var whs = require('../lib/index');

var logger = new winston.Logger({
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            prettyPrint: true,
            showLevel: true
        })
    ]
});

/** Preprocessing step for all commands.
  * @function pre
  * @protected
  * @returns {object} Sets verbosity and returns an object containing high level options for HTTP to avoid passing around the entire program object.
**/
function pre() {
    logger.transports.console.level = program.verbosity;
    return {
        host: program.host,
        apikey: program.apikey,
        port: program.port,
    };
}

program.version('0.0.5')
        .option('-v, --verbosity <level>', 'specify output verbosity (verbose|info|warn|error|silent) [error]', 'error')
        .option('-t, --host <host>', 'specify an alternate host [' + whs.HOST + ']', whs.HOST)
        .option('-k, --apikey <apikey>', 'specify the WHS API key. THIS IS REQUIRED.')
        .option('-p, --port <port>', 'specify an alternate port [' + whs.PORT + ']', whs.PORT);

program.command('user <action> [arg1] [arg2]')
    .description(whs.user.description)
    .action(function (action, arg1, arg2) {
        var options = pre();
        return whs.user.route(logger, options, action, arg1, arg2);
    });

program.command('site <action> [arg1] [arg2]')
    .description(whs.site.description)
    .action(function (action, arg1, arg2) {
        var options = pre();
        return whs.site.route(logger, options, action, arg1, arg2);
    });

program.command('app <action> [appID]')
    .description(whs.app.description)
    .action(function (action, arg1) {
        var options = pre();
        return whs.app.route(logger, options, action, arg1);
    });

program.command('vuln_class <action> <client_id>')
    .description(whs.vuln_class.description)
    .action(function (action, arg1) {
        var options = pre();
        return whs.vuln_class.route(logger, options, action, arg1);
    });

program.command('vuln_policy <action> [arg1] [arg2]')
    .description(whs.vuln_policy.description)
    .action(function (action, arg1, arg2) {
        var options = pre();
        return whs.vuln_policy.route(logger, options, action, arg1, arg2);
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