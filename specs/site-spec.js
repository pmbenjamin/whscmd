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
	describe("#list", function () {
		this.timeout(10000);
		it("should list some sites", function (done) {
			var list = site.list(logger, config.header, undefined, function (status, data) {
				status.should.equal(200);
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
				data.should.have.property("sites");	
				data.sites.length.should.be.greaterThan(0);	
	       		data.sites[0].should.have.property("id");	
	       		done();
			});
		});
	}); 

	describe("#list <siteID>", function () {
		it("should get a site", function (done) {
			var list = site.list(logger, config.header, config.site.id, function (status, data) {
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
	            data = _.isArray(data) ? data : [ data ];
				status.should.equal(200);
				data.length.should.equal(1);
				config.site.id.should.equal(parseInt(data[0].id));
				done();
			});			
		});
	});  
});
