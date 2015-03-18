var mocha = require('mocha');
var should = require('should');

var app = require("../lib/app");
var winston = require('winston');
var config = require('./config');
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

describe("Applications", function () {

	var appID;

	describe("#list", function () {
		this.timeout(30000);
		it("should list some apps", function (done) {
			console.log("whscmd app list -k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			var list = app.list(logger, config.header, undefined, function (status, data) {
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
				data.should.have.property("collection");	
				data.collection.length.should.be.greaterThan(0);	
	       		data.collection[0].should.have.property("id");
	       		var select = Math.round(Math.random() * (data.collection.length - 1));
	       		appID = data.collection[select].id;	
	       		done();
			});
		});
	}); 

	describe("#list <appID>", function () {
		it("should get an app", function (done) {
			console.log("whscmd app list", appID, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			var list = app.list(logger, config.header, appID, function (status, data) {
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
				data = _.isArray(data) ? data : [ data ];
				status.should.equal(200);
				data.length.should.equal(1);
				appID.should.equal(parseInt(data[0].id));
				done();
			});			
		});
	}); 
}); 
