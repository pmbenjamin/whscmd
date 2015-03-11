var mocha = require('mocha');
var should = require('should');

var user = require("../lib/user");
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

describe("Users", function () {
	describe("#list", function () {
		this.timeout(10000);
		it("should list some users", function (done) {
			var list = user.list(logger, config.header, undefined, function (status, data) {
				status.should.equal(200);
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
				data.length.should.be.greaterThan(0);	
	       		data[0].should.have.property("id");	
	       		done();
			});
		});
	}); 

	describe("#list <userID>", function () {
		it("should get a user", function (done) {
			var list = user.list(logger, config.header, config.user.id, function (status, data) {
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
	            data = _.isArray(data) ? data : [ data ];
				status.should.equal(200);
				data.length.should.equal(1);
				config.user.id.should.equal(parseInt(data[0].id));
				done();
			});			
		});
	});
});
