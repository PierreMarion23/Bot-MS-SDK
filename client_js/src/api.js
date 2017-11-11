
import axios from 'axios';

const URL_SERVER = 'http://localhost:5100';
const URL_API = URL_SERVER + '/api';

export default {

	Get(url, success, error) {
		var uri = URL_API + url;
		var token = 'fake token';
		// console.log(token);
		var options = { 'headers': tokenHeader(token) };

		console.log('inside Get url='+url);
		axios.get(uri, options).then(success, error);
	},

	Post(url, data, success, error) {
		var uri = URL_API + url;
		var token = 'fake token';
		// console.log(token);
		var options = { 'headers': tokenHeader(token) };

		console.log('inside Post url='+url);
		console.log(data)
		axios.post(uri, data, options).then(success, error);
	},

};

var tokenHeader = (token) => {
	return { 'Authorization': 'Bearer ' + token };
};

