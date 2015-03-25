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

describe("Vuln Policies", function () {

	describe("#create", function () {
		console.log("whscmd vuln_policy create", config.vuln_policy.createFile, "-k", config.header.apikey,
			"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
		this.timeout(30000);
		it("should create a policy", function (done) {
			loadJSON(config.vuln_policy.createFile, function (createData) {
				createData.name += " " + new Date();	// Need a unique name!
				vuln_policy.create(logger, config.header, createData, function (status, data) {
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

	describe("#list", function () {
		it("should list some policies", function (done) {
			console.log("whscmd vuln_policy list -k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
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

	describe("#list <policyID>", function () {
		it("should get a policy", function (done) {
			loadJSON(config.vuln_policy.createFile, function (createData) {
				console.log("whscmd vuln_policy list", vulnPolicyID, "-k", config.header.apikey,
					"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
				vuln_policy.list(logger, config.header, vulnPolicyID, function (status, data) {
					console.log("\tPolicyID: ", vulnPolicyID);
					status.should.equal(200);
					(function () { data = JSON.parse(data); }).should.not.throw(Error);
					createData.name = data.name;
					data = _.pick(data, _.keys(createData));
					assert.deepEqual(data, createData);
					done();
				});		
			});	
		});
	}); 

	describe("#update <policyID> <jsonFile>", function () {
		it("should update a policy", function (done) {
			console.log("whscmd vuln_policy update", vulnPolicyID, config.vuln_policy.updateFile, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			loadJSON(config.vuln_policy.updateFile, function (updateData) {
				vuln_policy.update(logger, config.header, vulnPolicyID, updateData, function (status, data) {
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

	describe("#apply <policyID> <jsonFile>", function () {
		it("should apply a policy to a set of sites", function (done) {
			console.log("whscmd vuln_policy apply", vulnPolicyID, config.vuln_policy.applyFile, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			loadJSON(config.vuln_policy.applyFile, function (applyData) {
				vuln_policy.apply(logger, config.header, vulnPolicyID, applyData, function (status, data) {
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
			console.log("whscmd vuln_policy fetch", vulnPolicyID, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			vuln_policy.fetch(logger, config.header, vulnPolicyID, function (status, data) {
				console.log("\tPolicyID: ", vulnPolicyID);
				status.should.equal(200);
				(function () { data = JSON.parse(data); }).should.not.throw(Error);
				data = _.pick(data, _.keys(data));
				assert.deepEqual(data, data);
				done();
			});
		});
	});

	describe("#delete <policyID>", function () {
		it("should not delete a policy if it has been applied to sites", function (done) {
			console.log("whscmd vuln_policy delete", vulnPolicyID, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			vuln_policy.delete(logger, config.header, vulnPolicyID, function (status, data) {
				console.log("\tPolicyID: ", vulnPolicyID);
				status.should.equal(405);	
				done();	
			});
		});

	});	

	describe("#apply <policyID> <jsonFile>", function () {
		it("should detach a policy from all sites", function (done) {
			console.log("whscmd vuln_policy apply", vulnPolicyID, config.vuln_policy.detachFile, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			loadJSON(config.vuln_policy.detachFile, function (detachData) {
				vuln_policy.apply(logger, config.header, vulnPolicyID, detachData, function (status, data) {
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
			console.log("whscmd vuln_policy delete", vulnPolicyID, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			vuln_policy.delete(logger, config.header, vulnPolicyID, function (status, data) {
				console.log("\tPolicyID: ", vulnPolicyID);
				status.should.equal(200);	
				done();	
			});
		});
	});
});
