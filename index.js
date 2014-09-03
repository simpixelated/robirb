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

		// get timeline to help prevent duplicate tweets
		bot.twit.get('statuses/user_timeline', {screen_name: bot.screen_name}, function (err, statuses, response) {
			if(err) return handleError(err, '\nfailed to get timeline');
			bot.cache = statuses;
		});

		// use Flickr to add tweets to queue
		bot.flickr.getPhotos(config.keyword, function (err, photos) {
			if(err) return handleError(err);
			var tweets = _.map(photos, function (photo) {
				//var descriptors = ['beautiful', 'gorgeous', 'nice', 'wow', 'stunning'];
				return {
					text: photo.title + ' ' + photo.url,
					approved: false
				};
			});
			bot.queueTweets(tweets, function (err, resp) {
				if(err) return handleError(err);
				console.log(resp);	
			});
			
		});

		setInterval(function() {
			var rand = Math.random();

	  		// post a tweet using a popular (based on retweets) tweet from search
	  		if(rand <= 0.10) {
				bot.tweetFromQueue(function (error, reply) {
					if(error) return handleError(error);
					console.log('\nTweet: ' + (reply ? reply.text : reply));
				});

			// retweet from search
			} else if(rand <= 0.20) {
				var params = {
			    	q: config.keyword,
			    	result_type: 'mixed',
			    	lang: 'en'
			    };

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