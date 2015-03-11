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

	describe("#list", function () {
		this.timeout(30000);
		it("should list some apps", function (done) {
			var list = app.list(logger, config.header, undefined, function (status, data) {
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
				data.should.have.property("collection");	
				data.collection.length.should.be.greaterThan(0);	
	       		data.collection[0].should.have.property("id");	
	       		done();
			});
		});
	}); 

	describe("#list <appID>", function () {
		it("should get an app", function (done) {
			var list = app.list(logger, config.header, config.app.id, function (status, data) {
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
				data = _.isArray(data) ? data : [ data ];
				status.should.equal(200);
				data.length.should.equal(1);
				config.app.id.should.equal(parseInt(data[0].id));
				done();
			});			
		});
	}); 
}); 
