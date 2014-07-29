(function() {
	var Bot = require('./bot'),
		config = require('./config'),
		bot = new Bot(config.twitter),
		flickr = require("./flickr"),
		_ = require('lodash-node');

	var interval = 120000,
		started = new Date();

	bot.flickr = new flickr(config.flickr);

	function start () {
		console.log('running Twitter behavior every ' + interval/1000 + ' seconds...');

		var params = {
			screen_name: bot.screen_name
		};

		// get timeline to help prevent duplicate tweets
		bot.twit.get('statuses/user_timeline', params, function (err, statuses, response) {
			if(err) return handleError(err, '\nfailed to get timeline');
			bot.cache = statuses;
		});

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

				//post a random photo from Flickr/Instagram/Tumblr/etc.
				bot.flickr.getPhoto(config.keyword, function (err, photo) {
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
			 
			    // bot.retweet(params, function(err, reply) {
			    //  	if(err) return handleError(err, '\ntried to retweet');
			    //   	console.log("\nRetweet: retweeted response: " + reply.id);
			    // });

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
		console.error(err);
		console.error('response status:', err.statusCode);
	  	console.error('data:', err.data);
	}

	start();

})();