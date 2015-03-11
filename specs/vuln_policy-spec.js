var mocha = require('mocha');
var should = require('should');
var _ = require('underscore');
var assert = require('assert');

var vuln_policy = require("../lib/vuln_policy");
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

function loadJSON(fileName, done) {
	var fs = require('fs');
	fs.readFile(fileName, 'utf8', function (err, data) {
        if (err) {  // Error during reading the file.
            logger.error('reading JSON  file => ' + err);
            done();
        }
        try {   // Try to parse the data from the file into JSON.
            done(JSON.parse(data));
        } catch (err) {     // Error during parsing of data.
            logger.error('parsing  file => ' + err);
            done();
        };
	});
}

var vulnPolicyID;
var createData;

describe("Vuln Policies", function () {

	describe("#list", function () {
		it("should list some policies", function (done) {
			vuln_policy.list(logger, config.header, undefined, function (status, data) {
				status.should.equal(200);
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
				data.should.have.property("vuln_custom_policies");	
				data.vuln_custom_policies.length.should.be.greaterThan(0);	
	       		data.vuln_custom_policies[0].should.have.property("risk_scores");	
	       		done();
			});
		});
	});  

	// Should load up the files and make this independent of the values.
	describe("#create", function () {
		this.timeout(30000);
		it("should create a policy", function (done) {
			loadJSON(config.vuln_policy.createFile, function (createData) {
				vuln_policy.create(logger, config.header, config.vuln_policy.createFile, function (status, data) {
					status.should.equal(201);
					(function () { data = JSON.parse(data); }).should.not.throw(Error);
					vulnPolicyID = data.id;			
					data = _.pick(data, _.keys(createData));					
					assert.deepEqual(data, createData);
					console.log("\tPolicyID: ", vulnPolicyID);
					done();
				});
			});
		});
	});

	describe("#list <policyID>", function () {
		it("should get a policy", function (done) {
			loadJSON(config.vuln_policy.createFile, function (createData) {
				vuln_policy.list(logger, config.header, vulnPolicyID, function (status, data) {
					console.log("\tPolicyID: ", vulnPolicyID);
					status.should.equal(200);
					(function () { data = JSON.parse(data); }).should.not.throw(Error);
					data = _.pick(data, _.keys(createData));
					assert.deepEqual(data, createData);
					done();
				});		
			});	
		});
	}); 

	describe("#update <policyID> <jsonFile>", function () {
		it("should update a policy", function (done) {
			loadJSON(config.vuln_policy.updateFile, function (updateData) {
				vuln_policy.update(logger, config.header, vulnPolicyID, config.vuln_policy.updateFile, function (status, data) {
					console.log("\tPolicyID: ", vulnPolicyID);
					status.should.equal(200);
					(function () { data = JSON.parse(data); }).should.not.throw(Error);
					data = _.pick(data, _.keys(updateData));
					assert.deepEqual(data, updateData);
					done();
				});
			});
		});
	});

	//

	describe("#apply <policyID> <jsonFile>", function () {
		it("should apply a policy to a set of sites", function (done) {
			loadJSON(config.vuln_policy.applyFile, function (applyData) {
				vuln_policy.apply(logger, config.header, vulnPolicyID, config.vuln_policy.applyFile, function (status, data) {
					console.log("\tPolicyID: ", vulnPolicyID);
					status.should.equal(200);
					(function () { data = JSON.parse(data); }).should.not.throw(Error);
					data = _.pick(data, _.keys(applyData));
					assert.deepEqual(data, applyData);
					done();
				});
			});
		});
	});

	describe("#fetch <policyID>", function () {
		it("should fetch which sites have a policy applied", function (done) {
			loadJSON(config.vuln_policy.applyFile, function (applyData) {
				vuln_policy.fetch(logger, config.header, vulnPolicyID, function (status, data) {
					console.log("\tPolicyID: ", vulnPolicyID);
					status.should.equal(200);
					(function () { data = JSON.parse(data); }).should.not.throw(Error);
					data = _.pick(data, _.keys(applyData));
					assert.deepEqual(data, applyData);
					done();
				});
			});
		});
	});

	describe("#delete", function () {
		it("should not delete a policy if it has been applied to sites", function (done) {
			vuln_policy.delete(logger, config.header, vulnPolicyID, function (status, data) {
				console.log("\tPolicyID: ", vulnPolicyID);
				status.should.equal(405);	
				done();	
			});
		});

	});	

	describe("#apply <policyID> <jsonFile>", function () {
		it("should detach a policy from all sites", function (done) {
			loadJSON(config.vuln_policy.detachFile, function (detachData) {
				vuln_policy.apply(logger, config.header, vulnPolicyID, config.vuln_policy.detachFile, function (status, data) {
					console.log("\tPolicyID: ", vulnPolicyID);
					status.should.equal(200);
					(function () { data = JSON.parse(data); }).should.not.throw(Error);
					data = _.pick(data, _.keys(detachData));
					assert.deepEqual(data, detachData);
					done();
				});
			});
		});
	});

	describe("#delete", function () {
		it("should delete a policy", function (done) {
			vuln_policy.delete(logger, config.header, vulnPolicyID, function (status, data) {
				console.log("\tPolicyID: ", vulnPolicyID);
				status.should.equal(200);	
				done();	
			});
		});
	});
});
