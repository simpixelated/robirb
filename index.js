(function() {
	var Bot = require('./bot.js'),
		config = require('./config.js'),
		bot = new Bot(config.twitter),
		_ = require('lodash-node');

	var interval = 60000,
		started = new Date();

	var Flickr = require("flickrapi");

	Bot.prototype.getFlickrPhoto = function (query, callback) {
		var cache = this.cache.flickr,
			self = this,
			photo;

		if (!cache) {
			Flickr.tokenOnly(config.flickr, function(err, flickr) {
				flickr.photos.search({ text: config.keyword }, function(err, result) {
					self.cache.flickr = _.map(_.shuffle(result.photos.photo), function (flickrPhoto) {
						flickrPhoto.url = 'https://flic.kr/p/'+base58encode(flickrPhoto.id);
						return flickrPhoto;
					});
					photo = self.cache.flickr.pop();
					return callback(err, photo);
				});
			});
		} else {
			photo = self.cache.flickr.pop();
			return callback(undefined, photo);			
		}
	};

	function start () {
		console.log('running Twitter behavior every ' + interval/1000 + ' seconds...');
		setInterval(function() {
			var rand = Math.random();

	  		// post a tweet using a popular (based on retweets) tweet from search
	  		if(rand <= 0.10) {
			 //    var params = {
			 //    	q: config.keyword,
			 //    	result_type: 'mixed',
			 //    	lang: 'en'
			 //    };

			 //    bot.twit.get('search/tweets', params, function (err, reply) {
				// 	if(err) return handleError(err);

				// 	var max = 0,
				// 		popular,
				// 		tweets = reply.statuses,
				// 		i = tweets.length;

				// 	while(i--) {
				// 		var tweet = tweets[i],
				// 			popularity = tweet.retweet_count;

				// 		if(popularity > max) {
				// 			max = popularity;
				// 		  	popular = tweet.text;
				// 		}
				// 	}

				// 	bot.tweet(popular, function (err, reply) {
				// 		if(err) return handleError(err);
				// 		console.log('\nTweet: ' + (reply ? reply.text : reply));
				// 	});
				// });

				// post a random photo from Flickr/Instagram/Tumblr/etc.
				bot.getFlickrPhoto(config.keyword, function (err, photo) {
					if(err) return handleError(err);
					bot.tweet(photo.title + ': ' + photo.url, function (err, reply) {
						if(err) return handleError(err, '\ntried to tweet photo');
						console.log('\nTweet: ' + (reply ? reply.text : reply));
					});
				});

			// retweet from search
			} else if(rand <= 0.20) {
				var params = {
			    	q: config.keyword,
			    	result_type: 'mixed',
			    	lang: 'en'
			    };
			 
			    bot.retweet(params, function(err, reply) {
			     	if(err) return handleError(err, '\ntried to retweet');
			      	console.log("\nRetweet: retweeted response: " + reply.id);
			    });

			// follow someone new
			} else if(rand <= 0.70) {

				if (Math.random() <= 0.50) {

					bot.mingle(function(err, reply) {
						if(err) return handleError(err, '\ntried to mingle');

						var name = reply.screen_name;
						console.log('\nMingle: followed @' + name);
				    });

				} else {
					var params = {
				    	q: config.keyword,
				    	result_type: 'mixed',
				    	lang: 'en'
				    };
				 
				    bot.searchFollow(params, function(err, reply) {
						if(err) return handleError(err, '\ntried to searchFollow');

						var name = reply.screen_name;
						console.log("\nSearchFollow: followed @" + name);
				    });
				}

			// remove a follower that doesn't follow you
			} else {
			    
			    bot.prune(function(err, reply) {
			    	if(err) return handleError(err, '\ntried to unfollow');

			      	var name = reply.screen_name
			      	console.log('\nPrune: unfollowed @'+ name);
			    });
			}
		}, interval);
	}

	function handleError(err, attempt) {
		if (attempt) { console.error(attempt); }
		console.error('response status:', err.statusCode);
	  	console.error('data:', err.data);
	}

	function base58encode(num) {
	    if (typeof num !== 'number') num = parseInt(num);
	    var enc = '',
	        alpha = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
	    var div = num,
	        mod;
	    while (num >= 58) {
	        div = num / 58;
	        mod = num - (58 * Math.floor(div));
	        enc = '' + alpha.substr(mod, 1) + enc;
	        num = Math.floor(div);
	    }
	    return (div) ? '' + alpha.substr(div, 1) + enc : enc;
	}

	start();

})();