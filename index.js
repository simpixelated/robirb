var Twit = require('twit');
var config = require('./config.js');

var T = new Twit({
	consumer_key:         config.consumer_key,
	consumer_secret:      config.consumer_secret,
	access_token:         config.access_token,
	access_token_secret:  config.access_token_secret
});

// T.post('statuses/update', { status: 'hello world!' }, function(err, data, response) {
//   console.log(data)
// });

T.get('search/tweets', { q: 'banana since:2011-11-11', count: 100 }, function(err, data, response) {
	console.log(data)
});