//
//  Bot
//  class for performing various twitter actions
//
const Twit = require('./node_modules/twit/lib/twitter')
const _ = require('lodash-node')
const fs = require('fs')

const Bot = module.exports = function (config) {
  this.twit = new Twit(config)
  this.cache = []
  this.queue = []
  this.screen_name = config.screen_name
}

// add a tweet to queue
Bot.prototype.queueTweets = function (tweets, callback) {
  const queue = './data/tweetQueue.json'
  const self = this

  fs.readFile(queue, (err, data) => {
    if (err) throw err
    data = JSON.parse(data)
    tweets = tweets.filter((tweet) => !self.isDuplicate(tweet.text, data.concat(self.cache)))

    if (!tweets.length) {
      return callback(null, `0 new tweets added | ${data.length} in queue (${data.filter(tweet => tweet.approved === true).length} approved)`)
    }
    // update the file
    fs.writeFile(queue, JSON.stringify(data.concat(tweets), null, 4), (err) => {
      if (err) {
        return callback(err)
      } else {
        return callback(null, `${tweets.length} new tweets added to queue`)
      }
    })
  })
}

Bot.prototype.tweetFromQueue = function (callback) {
  const queue = './data/tweetQueue.json'
  const self = this

  fs.readFile(queue, (err, data) => {
    if (err) throw err
    const tweets = JSON.parse(data)
    const tweet = tweets.find(tweet => tweet.approved === true)

    if (tweet) {
      self.tweet(tweet.text, callback)
      _.remove(tweets, (qTweet) => qTweet.text === tweet.text)
      // update the queue
      fs.writeFile(queue, JSON.stringify(tweets, null, 4), (err) => {
        if (err) {
          console.error(err)
        } else {
          console.log(`${tweets.length} tweets still in queue`)
        }
      })
    } else {
      return callback(new Error('no approved tweets in queue'))
    }
  })
}

//
//  post a tweet
//
Bot.prototype.tweet = function (status, callback) {
  if (typeof status !== 'string') {
    return callback(new Error('tweet must be of type String'))
  } else if (status.length > 140) {
    return callback(new Error(`tweet is too long: ${status.length}`))
  } else if (this.isDuplicate(status)) {
    return callback(new Error('tweet is a duplicate'))
  }
  this.twit.post('statuses/update', { status: status }, callback)
  // add the new tweet to the stash
  this.cache.push({ text: status })
}

//
// retweet
//
Bot.prototype.retweet = function (params, callback) {
  const self = this
  self.twit.get('search/tweets', params, (err, reply) => {
    if (err) return callback(err)
    const tweets = reply.statuses
    const randomTweet = self.randIndex(tweets)
    self.twit.post('statuses/retweet/:id', { id: randomTweet.id_str }, callback)
  })
}

//
//  choose a random friend of one of your followers, and follow that user
//
Bot.prototype.mingle = function (callback) {
  const self = this
  self.twit.get('followers/ids', (err, reply) => {
    if (err) { return callback(err) }
    const followers = reply.ids
    const randFollower = self.randIndex(followers)
    self.twit.get('friends/ids', { user_id: randFollower }, (err, reply) => {
      if (err) { return callback(err) }
      const friends = reply.ids
      const target = self.randIndex(friends)
      self.twit.post('friendships/create', { id: target }, callback)
    })
  })
}

//
//  follow someone new by searching for relevant tweets
//
Bot.prototype.searchFollow = function (params, callback) {
  const self = this
  self.twit.get('search/tweets', params, (err, reply) => {
    if (err) return callback(err)
    const tweets = reply.statuses
    const target = self.randIndex(tweets).user.id_str
    self.twit.post('friendships/create', { id: target }, callback)
 	})
}

//
//  prune your followers list; unfollow a friend that hasn't followed you back
//
Bot.prototype.prune = function (callback) {
  const self = this
  self.twit.get('followers/ids', (err, reply) => {
    if (err) return callback(err)
    const followers = reply.ids
    self.twit.get('friends/ids', (err, reply) => {
      if (err) return callback(err)
      const friends = reply.ids
      let pruned = false
      while (!pruned) {
        const target = self.randIndex(friends)
        if (!~followers.indexOf(target)) {
          pruned = true
          self.twit.post('friendships/destroy', { id: target }, callback)
        }
      }
    })
  })
}

//
// favorite a tweet
//
Bot.prototype.favorite = function (params, callback) {
  const self = this
  self.twit.get('search/tweets', params, (err, reply) => {
    if (err) return callback(err)
    const tweets = reply.statuses
    const randomTweet = randIndex(tweets)
    self.twit.post('favorites/create', { id: randomTweet.id_str }, callback)
  })
}

// check for duplicate tweets in recent timeline
Bot.prototype.isDuplicate = function (tweet, tweets) {
  tweets = tweets || this.cache
  return _.any(tweets, { text: tweet })
}

Bot.prototype.randIndex = function (arr) {
  const index = Math.floor(arr.length * Math.random())
  return arr[index]
}
