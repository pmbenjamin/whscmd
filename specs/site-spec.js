var mocha = require('mocha');
var should = require('should');

var site = require("../lib/site");
var winston = require('winston');
var config = require("./config");
var logger = new winston.Logger({
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            prettyPrint: true,
            showLevel: true
        })
    ]
});
logger.transports.console.level = config.log.level;
var _ = require("underscore");

describe("Sites", function () {
	var siteID;

	describe("#list", function () {
		this.timeout(10000);
		it("should list some sites", function (done) {
			console.log("whscmd site list -k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			var list = site.list(logger, config.header, undefined, function (status, data) {
				status.should.equal(200);
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
				data.should.have.property("sites");	
				data.sites.length.should.be.greaterThan(0);	
	       		data.sites[0].should.have.property("id");	
	       		var select = Math.round(Math.random() * (data.sites.length - 1));
	       		siteID = data.sites[select].id;
	       		done();
			});
		});
	}); 

	describe("#list <siteID>", function () {
		it("should get a site", function (done) {
			console.log("whscmd site list", siteID, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			var list = site.list(logger, config.header, siteID, function (status, data) {
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
	            data = _.isArray(data) ? data : [ data ];
				status.should.equal(200);
				data.length.should.equal(1);
				siteID.should.equal(parseInt(data[0].id));
				done();
			});			
		});
	});  
});
