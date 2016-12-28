/*
 * pinboard-api
 * https://github.com/tobiaswright/pinboard-api
 *
 * Copyright (c) 2014 Tobias Wright
 * Licensed under the MIT license.
 */

'use strict';

var request = require('request');
var config = {}

// # Pinboard API Documentation (v1)
config.apiVersion = 1

// ## Encoding
// All entities are encoded as UTF-8. In the length limits below, 'characters'
// means logical characters rather than bytes.
//
// All arguments should be passed URL-encoded. Where multiple arguments are
// allowed, they should be separated by URL-encoded whitespace
// (`apple+pear+orange`)

// ## Data Types
// The Pinboard API recognizes the following data types:
// ### tag
// up to 255 characters. May not contain commas or whitespace. Please be aware
// that tags beginning with a period are treated as private and trigger special
// private tag semantics.
// ### URL
// as defined by RFC 3986. Allowed schemes are http, https, javascript, mailto,
// ftp and file. The Safari-specific feed scheme is allowed but will be treated
// as a synonym for http.
// ### title
// up to 255 characters long
// ### text
// up to 65536 characters long. Any URLs will be auto-linkified when displayed
// ### datetime
// UTC timestamp in this format: 2010-12-11T19:48:02Z. Valid date range is
// Jan 1, 1 AD to January 1, 2100 (but see note below about future timestamps).
// ### date
// UTC date in this format: 2010-12-11. Same range as datetime above
// ### yes/no
// the literal string 'yes' or 'no'
// ### md5
// 32 character hexadecimal MD5 hash
// ### integer
// integer in the range 0..232
// ### format
// the literal string 'json' or 'xml'

// Methods return data in XML (default) or JSON format
config.responseFormat = "json"

// ## Rate Limits
// API requests are limited to one call per user every three seconds, except for
// the following:
//
// posts/all - once every five minutes
// posts/recent - once every minute
// If you need to make unusually heavy use of the API, please consider
// discussing it with me first, to avoid unhappiness.
//
// Make sure your API clients check for 429 Too Many Requests server errors and
// back off appropriately. If possible, keep doubling the interval between
// requests until you stop receiving errors.

// ## Error Handling
// The Pinboard API does its best to mimic the behavior Delicious API. If
// something goes wrong, you'll get the mysterious:
//
// <result code="something went wrong" />
//
// If an action succeeds, you'll get:
//
// <result code="done" />
//
// Or their JSON equivalents.

// ## API Methods
// All API methods are GET requests, even when good REST habits suggest they
// should use a different verb.
// API root URL:

config.url = {
	protocol: "https",
	api_root: "api.pinboard.in",
	api_prefix: "v1"
}

var methods = {
	update:       { verb: "GET", url: "posts/update" },
	delete_post:  { verb: "GET", url: "posts/delete" },
	add:          { verb: "GET", url: "posts/add" },
	access_token: { verb: "POST", url: "user/api_token/" },
	get_recent:   { verb: "GET", url: "posts/recent" },
	get_all:      { verb: "GET",  url: "posts/all" },
	list_tags:    { verb: "GET",  url: "tags/get" }
}

// ### GET /posts/update
// Returns the most recent time a bookmark was added, updated or deleted.
// Use this before calling posts/all to see if the data has changed since the
// last fetch.
var getLastupdate = function ( req, callback ) {

	var authString = req.user+":"+req.token;

	var options = {
		qs: {
			auth_token: authString,
			format: config.responseFormat
		},
		url: config.url.protocol + "://" + config.url.api_root + "/" + config.url.api_prefix + "/" + methods.update.url
	}

	request.get(options, function (error, response, body) {
		callback( body );
	});
}


// ### GET /posts/add
// Add a bookmark. Arguments with * are required.
//
// | argument     | type     | comment                                         |
// |--------------|----------|-------------------------------------------------|
// | *url         | url      | the URL of the item                             |
// | *description | title    | Title of the item. This field is unfortunately
//                             named 'description' for backwards compatibility
//                             with the delicious API                          |
// | extended     | text     | Description of the item. Called 'extended' for
//                             backwards compatibility with delicious API      |
// | tags         | tag      | List of up to 100 tags                          |
// | dt           | datetime | creation time for this bookmark. Defaults to
//                             current time. Datestamps more than 10 minutes
//                             ahead of server time will be reset to current
//                             server time                                     |
// | replace      | yes/no   | Replace any existing bookmark with this URL.
//                             Default is yes. If set to no, will throw an error
//                             if bookmark exists                              |
// | shared       | yes/no   | Make bookmark public. Default is "yes" unless
//                             user has enabled the "save all bookmarks as
//                             private" user setting, in which case default is
//                             "no"                                            |
// | toread       | yes/no   | Marks the bookmark as unread. Default is "no"   |
//
// If the post was successful:
// ```
// <result code="done" />
// ```
// If the post failed:
// ```
// <result code="something went wrong" />
// ```
var addBookmark = function( req, optional, callback ) {

	var authString = req.user+":"+req.token,
		args = [];

	var options = {
		qs: {
			auth_token: authString,
			format: config.responseFormat,
			url: req.url,
			description: req.title
		},
		url: config.url.protocol + "://" + config.url.api_root + "/" + config.url.api_prefix + "/" + methods.add.url
	}

	for (var i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}

	callback = args.pop();

	if (arguments.length > 1) {
		for (var prop in optional) {
			if (optional.hasOwnProperty(prop)) {
				options.qs[prop] = optional[prop];
			}
		}
	}

	request.get(options, function (error, response, body) {
		callback( body );
	});
}


// ### GET /posts/delete
// Delete a bookmark. Arguments with * required.
//
// | argument | type | comment |
// |----------|------|---------|
// | *url     | url  |         |
var deleteBookmark = function ( req, callback ) {

	var authString = req.user+":"+req.token;

	var options = {
		qs: {
			auth_token: authString,
			format: config.responseFormat,
			url: req.url
		},
		url: config.url.protocol + "://" + config.url.api_root + "/" + config.url.api_prefix + "/" + methods.delete_post.url
	}

	request.get(options, function (error, response, body) {
		callback( body );
	});
}

// ### GET /posts/get
// Returns one or more posts on a single day matching the arguments. If no date
// or url is given, date of most recent bookmark will be used.
//
// | argument     | type     | comment                                         |
// |--------------|----------|-------------------------------------------------|
// | tag          | tag      | filter by up to three tags                      |
// | dt           | date     | return results bookmarked on this day           |
// | url          | url      | return bookmark for this URL                    |
// | meta         | yes/no   | include a change detection signature in a meta
//                             attribute                                       |


// ### GET /posts/recent
// Returns a list of the user's most recent posts, filtered by tag.
//
// | argument | type | comment                                                |
// |----------|------|--------------------------------------------------------|
// | tag      | tag  | filter by up to three tags                             |
// | count    | int  | number of results to return. Default is 15, max is 100 |
var getRecent = function( req, optional, callback ) {

	var authString = req.user+":"+req.token,
		args = [];

	var options = {
		qs: {
			auth_token: authString,
			format: config.responseFormat
		},
		url: config.url.protocol + "://" + config.url.api_root + "/" + config.url.api_prefix + "/" + methods.get_recent.url
	}

	for (var i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}

	callback = args.pop();

	if (arguments.length > 1) {
		for (var prop in optional) {
			if (optional.hasOwnProperty(prop)) {
				options.qs[prop] = optional[prop];
			}
		}
	}

	request.get(options, function (error, response, body) {
		callback( body );
	});
}


// ### GET /posts/dates
// Returns a list of dates with the number of posts at each date.
//
// | argument | type | comment                    |
// |----------|------|----------------------------|
// | tag      | tag  | filter by up to three tags |


// ### GET /posts/all
// Returns all bookmarks in the user's account.
//
// | argument | type     | comment |
// |----------|----------|-----------------------------------------------------|
// | tag      | tag      | filter by up to three tags                          |
// | start    | int      | offset value (default is 0)                         |
// | results  | int      | number of results to return. Default is all         |
// | fromdt   | datetime | return only bookmarks created after this time       |
// | todt     | datetime | return only bookmarks created before this time      |
// | meta     | int      | include a change detection signature for each
//                         bookmark                                            |
var getAll = function( req, optional, callback ) {

	var authString = req.user+":"+req.token,
		args = [];

	var options = {
		qs: {
			auth_token: authString,
			format: config.responseFormat
		},
		url: config.url.protocol + "://" + config.url.api_root + "/" + config.url.api_prefix + "/" + methods.get_all.url
	}

	for (var i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}

	callback = args.pop();

	if (arguments.length > 1) {
		for (var prop in optional) {
			if (optional.hasOwnProperty(prop)) {
				options.qs[prop] = optional[prop];
			}
		}
	}


	request.get(options, function (error, response, body) {
		callback( body );

	});
}


// ### GET /posts/suggest
// Returns a list of popular tags and recommended tags for a given URL. Popular
// tags are tags used site-wide for the url; recommended tags are drawn from the
// user's own tags.
//
// | argument | type | comment |
// |----------|------|---------|
// | *url     | url  |         |


// ### GET /tags/get
// Returns a full list of the user's tags along with the number of times they
// were used.
var getTags = function ( req, optional, callback ) {

	var authString = req.user+":"+req.token;

	var options = {
		qs: {
			auth_token: authString,
			format: config.responseFormat
		},
		url: config.url.protocol + "://" + config.url.api_root + "/" + config.url.api_prefix + "/" + methods.list_tags.url
	}

	request.get(options, function (error, response, body) {
		var tags = JSON.parse(body)
		var tags_array = []

		for (var tag in tags) {
			var this_tag_obj = {"name": tag, "count": tags[tag]}
			tags_array.push(this_tag_obj)
		}
		callback( tags_array);
	});
}


// ### GET /tags/delete
// Delete an existing tag.
//
// | argument | type | comment |
// |----------|------|---------|
// | *tag     | tag  |         |


// ### GET /tags/rename
// Rename an tag, or fold it in to an existing tag
//
// | argument | type | comment                           |
// |----------|------|-----------------------------------|
// | old      | tag  | note: match is not case sensitive |
// | new      | tag  | if empty, nothing will happen     |


// ### GET /user/secret
// Returns the user's secret RSS key (for viewing private feeds)


// ### GET /user/api_token/
// Returns the user's API token (for making API calls without a password)
var getAcessToken = function( req, callback ) {

	var url = config.url.protocol + "://" + req.user + ":" + req.password +"@"+ config.url.api_root + "/" + config.url.api_prefix + "/" + methods.access_token.url;

	var options = {
		qs: {
			format: config.responseFormat
		},
		url: url
	}

	request.post(options, function (error, response, body) {
		// pinboard's API returns an object in the formata of
		// ```
		//{"result": "<access_token>"}
		//```
		var token = JSON.parse(body).result
		callback(token);
	});
}

// ### GET /notes/list
// Returns a list of the user's notes


// ### GET /notes/<hash>
// Returns an individual user note. The `hash` property is a 20 character long
// sha1 hash of the note text.


module.exports = {
	addBookmark: addBookmark,
	deleteBookmark: deleteBookmark,
	getLastupdate: getLastupdate,
	getAcessToken: getAcessToken,
	getRecent: getRecent,
	getAll: getAll
}
