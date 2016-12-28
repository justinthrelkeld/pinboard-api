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

config.apiVersion = 1

config.responseFormat = "json"


config.url = {
	protocol: "https",
	api_root: "api.pinboard.in",
	api_prefix: "v1"
}

var methods = {
	update:       { verb: "GET", url: "posts/update" },
	delete_post:  { verb: "GET", url: "posts/delete" },
	add:          { verb: "GET", url: "posts/add" },
	access_token: { verb: "GET", url: "user/api_token/" },
	get_recent:   { verb: "GET", url: "posts/recent" },
	get_all:      { verb: "GET", url: "posts/all" }
}
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
var getAcessToken = function( req, callback ) {

	var url = config.url.protocol + "://" + req.user + ":" + req.password +"@"+ config.url.api_root + "/" + config.url.api_prefix + "/" + methods.access_token.url;

	var options = {
		qs: {
			format: config.responseFormat
		},
		url: url
	}

	request.post(options, function (error, response, body) {
		callback(body);
	});
}

module.exports = {
	addBookmark: addBookmark,
	deleteBookmark: deleteBookmark,
	getLastupdate: getLastupdate,
	getAcessToken: getAcessToken,
	getRecent: getRecent,
	getAll: getAll
}
