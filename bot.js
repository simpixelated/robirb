//
//  Bot
//  class for performing various twitter actions
//
var Twit = require('./node_modules/twit/lib/twitter'),
	_ = require('lodash-node'),
	fs = require('fs'),
	Bot = module.exports = function(config) { 
		this.twit = new Twit(config);
		this.cache = [];
		this.queue = [];
		this.screen_name = config.screen_name;
	};

// add a tweet to queue
Bot.prototype.queueTweets = function (tweets, callback) {
	var queue = './data/tweetQueue.json',
		self = this;

	fs.readFile(queue, function (err, data) {
		if (err) throw err;
		data = JSON.parse(data);
		tweets = _.filter(tweets, function (tweet) {
			return !self.isDuplicate(tweet.text, data.concat(self.cache));
		});

		if (!tweets.length) {
			return callback(null, 'no new tweets added, ' + data.length + ' in queue');
		}
		// update the file
		fs.writeFile(queue, JSON.stringify(data.concat(tweets), null, 4), function(err) {
			if(err) {
		    	return callback(err);
		    } else {
		        return callback(null, tweets.length + ' new tweets added to queue');
		    }
		}); 
	});
};

Bot.prototype.tweetFromQueue = function (callback) {
	var queue = './data/tweetQueue.json',
		self = this;

	fs.readFile(queue, function (err, data) {
		if (err) throw err;
		var tweets = JSON.parse(data),
			tweet = _.find(tweets, 'approved');

		if (tweet) {
			console.log(tweet.text);
			//self.tweet(tweet.text, callback);
			_.remove(tweets, function (qTweet) { return qTweet.text === tweet.text; });
			// update the file
			fs.writeFile(queue, JSON.stringify(tweets, null, 4), function(err) {
				if(err) {
			    	console.log(err);
			    } else {
			        console.log(tweets.length + ' tweets queued');
			    }
			});
		} else {
			return callback(new Error('no approved tweets in queue'));
		}
	});
};

//
//  post a tweet
//
Bot.prototype.tweet = function (status, callback) {
	if(typeof status !== 'string') {
		return callback(new Error('tweet must be of type String'));
  	} else if(status.length > 140) {
		return callback(new Error('tweet is too long: ' + status.length));
  	} else if(this.isDuplicate(status)) {
  		return callback(new Error('tweet is a duplicate'));
  	}
  	this.twit.post('statuses/update', { status: status }, callback);
  	// add the new tweet to the stash
  	this.cache.push({ text: status });
};

//
// retweet
//
Bot.prototype.retweet = function (params, callback) {
  	var self = this;
 
  	self.twit.get('search/tweets', params, function (err, reply) {
		if(err) return callback(err);
 
		var tweets = reply.statuses,
			randomTweet = self.randIndex(tweets);
 
		self.twit.post('statuses/retweet/:id', { id: randomTweet.id_str }, callback);
  	});
};

//
//  choose a random friend of one of your followers, and follow that user
//
Bot.prototype.mingle = function (callback) {
  	var self = this;
  
  	this.twit.get('followers/ids', function(err, reply) {
	  	if(err) { return callback(err); }
	  
	  	var followers = reply.ids,
			randFollower  = self.randIndex(followers);
		
	  	self.twit.get('friends/ids', { user_id: randFollower }, function(err, reply) {
		  	if(err) { return callback(err); }
		  
		  	var friends = reply.ids,
				target  = self.randIndex(friends);
			
		  	self.twit.post('friendships/create', { id: target }, callback); 
		});
	});
};

//
//  follow someone new by searching for relevant tweets
//
Bot.prototype.searchFollow = function (params, callback) {
	var self = this;
 
  	this.twit.get('search/tweets', params, function (err, reply) {
		if(err) return callback(err);
	 
		var tweets = reply.statuses,
			target = self.randIndex(tweets).user.id_str;
	 
		self.twit.post('friendships/create', { id: target }, callback);
 	});
};

//
//  prune your followers list; unfollow a friend that hasn't followed you back
//
Bot.prototype.prune = function (callback) {
  	var self = this;
  
  	this.twit.get('followers/ids', function(err, reply) {
	  	if(err) return callback(err);
	  
	  	var followers = reply.ids;
	  
	  	self.twit.get('friends/ids', function(err, reply) {
		  	if(err) return callback(err);
		  
		  	var friends = reply.ids,
				pruned = false;
		  
		  	while(!pruned) {
				var target = self.randIndex(friends);
			
				if(!~followers.indexOf(target)) {
					pruned = true;
				  	self.twit.post('friendships/destroy', { id: target }, callback);   
				}
		  	}
	  	});
  	});
};

//
// favorite a tweet
//
Bot.prototype.favorite = function (params, callback) {
  	var self = this;
 
  	self.twit.get('search/tweets', params, function (err, reply) {
    	if(err) return callback(err);
 
    	var tweets = reply.statuses,
    		randomTweet = randIndex(tweets);
 
    	self.twit.post('favorites/create', { id: randomTweet.id_str }, callback);
  	});
};

// check for duplicate tweets in recent timeline
Bot.prototype.isDuplicate = function (tweet, tweets) {
	tweets = tweets || this.cache;
	return _.any(tweets, { text: tweet });
};

Bot.prototype.randIndex = function (arr) {
  	var index = Math.floor(arr.length*Math.random());
  	return arr[index];
};