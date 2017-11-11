'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var URL_SERVER = 'http://localhost:5100';
var URL_API = URL_SERVER + '/api';

exports.default = {
	Get: function Get(url, success, error) {
		var uri = URL_API + url;
		var token = 'fake token';
		// console.log(token);
		var options = { 'headers': tokenHeader(token) };

		console.log('inside Get url=' + url);
		_axios2.default.get(uri, options).then(success, error);
	},
	Post: function Post(url, data, success, error) {
		var uri = URL_API + url;
		var token = 'fake token';
		// console.log(token);
		var options = { 'headers': tokenHeader(token) };

		console.log('inside Post url=' + url);
		console.log(data);
		_axios2.default.post(uri, data, options).then(success, error);
	}
};


var tokenHeader = function tokenHeader(token) {
	return { 'Authorization': 'Bearer ' + token };
};