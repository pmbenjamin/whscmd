
![WhiteHat](images/WhiteHatLogoColor.png)

WHS Command
============


`whscmd` is a node-based command line utility by [WhiteHat Security](http://www.whitehatsec.com) for interacting with the WhiteHat API.

Current Status
--------------

[**ALPHA**] v0.0.6

###Release Notes

See the [git repo](https://git.dev.whs/carlorthlieb/whscmd/commits/master]).

Installation
-------------

You will first need to install [node](https://nodejs.org/).

`whscmd` is available as a node.js NPM module can be installed by as follows:

	[sudo] npm install -g whscmd

Local Installation
------------------

To install your own local copy (with executable), clone this repository, navigate to the top level directory, and install via:

	npm install -g .	

Running whscmd from the command line
-------------------------------

You can run the whscmd utility from the command line as long as node is installed.

	Usage: whscmd [options] <command> <action> [params]

###Options
Options are invoked either with a dash and the flag letter or with a double dash and the long name for the option. Note that some options require additional information as specified below.

`whscmd -<flag> [param]` or `whscmd --<name> [param]`

| Flag | Name | Param | Description | 
| :---- | :---- | :----- | :----------- |
| h | help | _none_ | Output usage information. |
| V | version | _none_ | Output the version number of the command. 
| v | verbosity | verbose, info, warn, error, silent |  Verbosity of output. Default is **error**. |
| t | host | url | Specify an alternate host for the command to run against. Default is <https://sentinel.whitehatsec.com>. |
| k | apikey | string | NOT OPTIONAL. This is required for all commands. Note that you must set up the API key in Sentinel to allow access by this utility. |
| p | port | number | Alternate port. Default is **443**. |

###Commands

####App
#####app list [appID]
	
Lists all current applications or a single application if _appID_ is specified. Returns app ID, label, and status for each site.

####Site
#####site list [siteID]
	
Lists all current sites or a single site if _siteID_ is specified. Returns site ID, label, and scan status for each site.

####User
#####user create \<jsonFile\>
Creates a new user based on the user definition in the supplied file path _jsonFile_. The JSON file needs to have the following format:

| Entry | Type | Attributes | Description |
| :---- | :--- | :--------- | :---------- |
| username | string | - | User name in the form of an email address. Must be unique. |
| client_id | integer | - | Client id that this user should be assigned to.  |
| role | ( Admin \| Dev \| Secops \| Secops Admin \| Viewer ) | - | Type of user |
| type | string | - | Must be "sentinel" |
| first_name | string | optional | First name |
| last_name | string | optional | Last name |
| job_title | string | optional | Job title |
| address | string | optional | Address |
| city | string | optional | City |
| state | string | optional | State/province/region |
| zipcode | string | optional | Zip or postal code |
| country | string | optional | Country |
| timezone | ( America/New\_York \| America/Chicago \| America/Denver \| America/Los\_Angeles \| America/Anchorage \| America/Lima \| America/Santiago \| America/Sao\_Paulo \| America/St\_Johns \| America/Tegucigalpa \| America/Toronto \| Africa/Cairo \| Africa/Johannesburg \| Asia/Bangkok \| Asia/Calcutta \| Asia/Colombo \| Asia/Dubai \| Asia/Hong\_Kong \| Asia/Jerusalem \| Asia/Kamchatka \| Asia/Karachi \| Asia/Singapore \| Asia/Tokyo \| Asia/Vladivostok \| Australia/Adelaide \| Australia/Sydney \| Europe/Amsterdam \| Europe/Athens \| Europe/London \| Europe/Moscow \| Pacific/Auckland \| Pacific/Honolulu ) | optional | Time zone |
| phone | string | optional | Phone number |
| mobile | string | optional | Mobile number |
| fax | string | optional | Fax number |

Example:

	{
		"username": "foo@bar.com",
		"client_id": "1",
		"first_name": "Elon",
		"last_name": "Bar",
		"type": "sentinel",
		"role": "Viewer",
		"address": "1011 Maserati Drive",
		"city": "Teslaville",
		"state": "CA",
		"zipcode": "95054",
		"country": "USA",
		"phone": "+1 408 555 1212",
		"fax": "+1 408 555 1111"
	}  
	
#####user delete \<userID\>
Deletes an existing user as specified by _userID_.

#####user list [userID]

Lists all current users or a single user if _userID_ is specified. Returns name, user name, company, role, and client ID for each user.

#####user update \<userID\> \<jsonFile\>
Updates an existing user specified by _userID_ with the user definition in the supplied file path _jsonFile_. The JSON file needs to have a format identical to that of the _create_ action.

####Vuln Class
#####vuln\_class list \<clientID\>

Lists all vulnerability classes for the specified _clientID_. Returns vuln class ID, short name, and full name for the vuln classs.
	
####Vuln Policy
#####vuln\_policy apply \<policyID\> <jsonFile>
Applies the policy specified by _policyID_ to the list of sites and applications listed in the supplied file _jsonFile_. The JSON file needs to have the following format:
	
	{
		"sites": [ <site_id>, ... ],
		"applications": [ <app_id>, ... ]
	}    


#####vuln\_policy create \<jsonFile\>

Creates a new policy based on the policy in the supplied file path _jsonFile_. The json file needs to have the following format: 

| Entry | Type | Attributes | Description |
| :---- | :--- | :--------- | :---------- |
| name | string | - | Name of the policy. Must be unique. |
| description | string | optional | Description of the policy. |
| risk_scores | array | - | Array of risk score entries. |

Each risk score entry consists of the following fields:

| Entry | Possible Value | Description |
| :----- | :-------------- | :----------- |
| vuln\_class\_id | integer | A valid ID as returned by the `vuln_class list` command. |
| risk_score | integer | A number from 1 (least severe) to 5 (most severe). When the policy is applied to an asset, this risk score will override the existing default for the vuln class. |
| [accepted] | 0 or 1 | Optional. Determines whether the vuln class is accepted and will be suppressed from the UI and most reports. Default is 0. |

Example:
 	
	{
		"name": "High Value",
		"description": "Policy to use on high value assets.",
		"risk_scores": [
			{
				"vuln_class_id": 1,
				"risk_score": 5
			},
			{
				"vuln_class_id": 2,
				"risk_score": 4
			},
			{
				"vuln_class_id": 5,
				"risk_score": 3
			},
			{
				"vuln_class_id": 6,
				"risk_score": 2
	  		}
	 	]
	}    

#####vuln\_policy delete \<policyID\>
Deletes an existing policy specified by _policyID_.

#####vuln_policy fetch \<policyID\>
Return the list of sites and apps that the policy specified by _policyID_ has been attached to.

#####vuln\_policy update \<policyID\> \<jsonFile\>
Updates an existing policy specified by _policyID_ and the policy in the supplied file path _jsonFile_. The JSON file needs to have a format identical to that of the _create_ action.

#####vuln\_policy list [policyID]	
Lists all custom vulnerability policies or a single policy if _policyID_ is specified. Returns name, policyID, description, risk scores (vuln class ID/risk score list) for each policy.

Generating Documentation
------------------------

**whscmd** uses [JSDoc](http://usejsdoc.org) to generate documentation from this README.md and comments in the code. You can install jsdoc via npm:

	npm install jsdoc -g

To generate documentation, on the command line in the top level directory for the project invoke

	jsdoc lib -r --readme ./README.md -d doc -P ./package.json
	
Resulting documentation suitable for publishing can be found in the _doc_ folder.

Running Tests
-------------
**whscmd** uses the [mocha](http://mochajs.org/) test suite to ensure that the command line is working correctly. You can install mocha via npm:

	npm install mocha -g

Tests can be found in the `specs` directory. You will need to modify `config.template.json`, supply an API key and valid IDs, and save it as `config.json` in the `specs` directory. Once that is complete, you can run the tests by invoking:

	mocha specs/

Credits
-------

Main whscommander: Carl Orthlieb, API by Terence Montiero

Many thanks to the node community, the commander.js folks, and suggestions from the rest of the WhiteHat Security team.

Legal
------

`whscmd` is developed by WhiteHat Security and is copyright (c) 2015 by WhiteHat Security Inc. All Rights Reserved.
whscmd is made available under the Apache Public License, version 2.  See the [LICENSE](LICENCE) file for more information.

