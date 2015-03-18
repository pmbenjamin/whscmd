var mocha = require('mocha');
var should = require('should');
var _ = require('underscore');
var assert = require('assert');

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

describe("Users", function () {
	var userID;

	describe("#create", function () {
		this.timeout(30000);
		it("should create a user", function (done) {
			console.log("whscmd user create", config.user.createFile, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			loadJSON(config.user.createFile, function (createData) {
				user.create(logger, config.header, createData, function (status, data) {
					status.should.equal(201);
					(function () { data = JSON.parse(data); }).should.not.throw(Error);
					userID = data.id;			
					data = _.pick(data, _.keys(createData));					
					assert.deepEqual(data, createData);
					console.log("\tUserID: ", userID);
					done();
				});
			});
		});
	});

	describe("#list", function () {
		this.timeout(10000);
		it("should list some users", function (done) {
			console.log("whscmd user list -k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
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
			console.log("whscmd user list", userID, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			loadJSON(config.user.createFile, function (createData) {
				user.list(logger, config.header, userID, function (status, data) {
					console.log("\tUserID: ", userID);
					status.should.equal(200);
					(function () { data = JSON.parse(data); }).should.not.throw(Error);
					data = _.pick(data, _.keys(createData));
					console.log('DATA: ', JSON.stringify(data));
					console.log('RETN: ', JSON.stringify(createData));
					assert.deepEqual(data, createData);
					done();
				});		
			});	
		});
	}); 

	describe("#update <userID> <jsonFile>", function () {
		it("should update a user", function (done) {
			console.log("whscmd user update", config.user.updateFile, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			loadJSON(config.user.updateFile, function (updateData) {
				user.update(logger, config.header, userID, updateData, function (status, data) {
					console.log("\tUserID: ", userID);
					status.should.equal(200);
					(function () { data = JSON.parse(data); }).should.not.throw(Error);
					data = _.pick(data, _.keys(updateData));
					assert.deepEqual(data, updateData);
					done();
				});
			});
		});
	});

	describe("#delete", function () {
		it("should delete a user", function (done) {
			console.log("whscmd user delete", userID, "-k", config.header.apikey,
				"-t", config.header.host, "-p", config.header.port, "-v", config.log.level);
			user.delete(logger, config.header, userID, function (status, data) {
				console.log("\tUserID: ", userID);
				status.should.equal(200);	
				done();	
			});
		});
	});
});
