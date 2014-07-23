/* TODO:
   * follow new friends
   * favorite new mentions
   * send DM when someone retweets an original tweet (and they are friend)
   * tweet images from instagram:
   		http://instagram.com/developer/endpoints/tags/#get_tags_media_recent
   * tweet images from tumblr:
   		http://www.tumblr.com/docs/en/api/v2#tagged-method
   * use Wolfram Alpa to respond to @mentions
     	http://products.wolframalpha.com/developers/
     	https://github.com/leops/node-wolfram
     	http://ctrlq.org/code/19408-create-bot
   * tweet content from Reddit
   		http://www.reddit.com/r/Fiat/
   		http://www.reddit.com/search?q=abarth
   		http://www.reddit.com/dev/api#GET_search
   * tweet images from Google CSE?
   * tweet links to Amazon products
   * tweet links to fiat500abarth.us
   * tweet articles from the other FIAT site
   * tweet content from the other FIAT forum
   * tweet content from YouTube:
     	https://developers.google.com/youtube/v3/docs/search/list
   * prevent duplicate tweets... maybe cache timeline and do text search against it before posting?

   https://help.hootsuite.com/entries/22460803-What-are-some-advanced-Twitter-search-examples-
*/
(function() {
	var Bot = require('./bot.js'),
		config = require('./config.js'),
		bot = new Bot(config.twitter);

	var interval = 120000,
		started = new Date();

	var Flickr = require("flickrapi");

	function start () {
		console.log('running Twitter behavior every ' + interval/1000 + ' seconds...');
		setInterval(function() {
			var rand = Math.random();

	  		// post a tweet using a popular (based on retweets) tweet from search
	  		if(rand <= 0.10) {
			    /*var params = {
			    	q: 'fiat 500 abarth',
			    	result_type: 'mixed',
			    	lang: 'en'
			    };

			    bot.twit.get('search/tweets', params, function (err, reply) {
					if(err) return handleError(err);

					var max = 0,
						popular,
						tweets = reply.statuses,
						i = tweets.length;

					while(i--) {
						var tweet = tweets[i],
							popularity = tweet.retweet_count;

						if(popularity > max) {
							max = popularity;
						  	popular = tweet.text;
						}
					}

					bot.tweet(popular, function (err, reply) {
						if(err) return handleError(err);
						console.log('\nTweet: ' + (reply ? reply.text : reply));
					});
				});*/

				// post a random photo from Flickr
				Flickr.tokenOnly(config.flickr, function(error, flickr) {
					flickr.photos.search({ text: 'fiat+500+abarth' }, function(err, result) {
						if(err) return handleError(err);

						var photo = bot.randIndex(result.photos.photo),
							url = 'https://flic.kr/p/'+base58encode(photo.id);

						bot.tweet(photo.title + ': ' + url, function (err, reply) {
							if(err) return handleError(err, '\ntried to tweet Flickr');
							console.log('\nTweet: ' + (reply ? reply.text : reply));
						});
					});
				});

			// retweet from search
			} else if(rand <= 0.20) {
				var params = {
			    	q: 'fiat 500 abarth',
			    	result_type: 'mixed',
			    	lang: 'en'
			    };
			 
			    bot.retweet(params, function(err, reply) {
			     	if(err) return handleError(err, '\ntried to retweet: ' + reply.id);
			      	console.log("\nRetweet: retweeted response: " + reply.id);
			    });

			// follow someone new
			} else if(rand <= 0.50) {

				if (Math.random() <= 0.50) {

					bot.mingle(function(err, reply) {
						if(err) return handleError(err, '\ntried to mingle');

						var name = reply.screen_name;
						console.log('\nMingle: followed @' + name);
				    });

				} else {
					var params = {
				    	q: 'fiat 500 abarth',
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