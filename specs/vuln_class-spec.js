var mocha = require('mocha');
var should = require('should');

var vuln_class = require("../lib/vuln_class");
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

describe("Vuln Classes", function () {
	describe("#list", function () {
		this.timeout(10000);
		it("should list some classes", function (done) {
			console.log("whscmd vuln_class list", config.vuln_class.id, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			var list = vuln_class.list(logger, config.header, config.vuln_class.id, function (status, data) {
				status.should.equal(200);
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
				data.should.have.property("all_vuln_classes");
				data.all_vuln_classes.length.should.be.greaterThan(0);	
	       		data.all_vuln_classes[0].should.have.property("id");	
	       		done();
			});
		});
	}); 
});