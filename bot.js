//
//  Bot
//  class for performing various twitter actions
//
const Twitter = require('twitter')
const _ = require('lodash')
const fs = require('fs')

const Bot = module.exports = function (config, devMode) {
  this.twit = new Twitter(config)
  this.cache = []
  this.queue = []
  this.screen_name = config.screen_name
  if (devMode === true) {
    console.log('devMode enabled; no tweets will be posted')
    this.twit.post = (url, param, callback) => {
      console.log(url, param)
      callback()
    }
    this.twit.tweet = (text, callback) => {
      console.log(text)
      callback()
    }
  }
}

Bot.prototype.populateCache = async function () {
  const statuses = await this.twit.get('statuses/user_timeline', { screen_name: this.screen_name })
  this.cache = statuses.map(status => {
    return {
      text: status.text,
      url: _.get(status, 'entities.urls[0].expanded_url')
    }
  })
  return this.cache
}

// add a tweet to queue
Bot.prototype.queueTweets = async function (tweets) {
  const queue = `./data/tweetQueue-${this.screen_name}.json`
  let data = []

  try {
    data = JSON.parse(fs.readFileSync(queue))
  } catch (error) {
    fs.writeFileSync(queue, data)
  }
  tweets = tweets.filter((tweet) => !this.isDuplicate(tweet.text, data.concat(this.cache)))
  if (!tweets.length) {
    console.log(`0 new tweets added | ${data.length} in queue (${data.filter(tweet => tweet.approved === true).length} approved)`)
  }
  // update the file
  fs.writeFileSync(queue, JSON.stringify(data.concat(tweets), null, 4))
  console.log(`${tweets.length} new tweets added to queue`)
}

Bot.prototype.tweetFromQueue = async function () {
  const queue = `./data/tweetQueue-${this.screen_name}.json`
  const tweets = JSON.parse(fs.readFileSync(queue))
  const tweet = tweets.find(tweet => tweet.approved === true)
  if (tweet) {
    const response = await this.tweet(tweet.text)
    _.remove(tweets, (qTweet) => qTweet.text === tweet.text)
    // update the queue
    fs.writeFileSync(queue, JSON.stringify(tweets, null, 4))
    console.log(`${tweets.length} tweets still in queue`)
    return response
  } else {
    console.error('No approved tweets in queue')
    return null
  }
}

//
//  post a tweet
//
Bot.prototype.tweet = async function (status) {
  if (typeof status !== 'string') {
    throw new Error('tweet must be of type String')
  } else if (status.length > 140) {
    throw new Error(`tweet is too long: ${status.length}`)
  } else if (this.isDuplicate(status)) {
    throw new Error('tweet is a duplicate')
  }
  const response = await this.twit.post('statuses/update', { status: status })
  // add the new tweet to the stash
  this.cache.push({ text: status })
  return response
}

//
// retweet
//
Bot.prototype.retweet = async function (params) {
  const reply = await this.twit.get('search/tweets', params)
  const tweets = reply.statuses
  const randomTweet = this.randIndex(tweets)
  return this.twit.post('statuses/retweet/:id', { id: randomTweet.id_str })
}

//
//  choose a random friend of one of your followers, and follow that user
//
Bot.prototype.mingle = async function () {
  const { ids: followers } = await this.twit.get('followers/ids', { screen_name: this.screen_name })
  const randFollower = this.randIndex(followers)
  const { ids: friends } = await this.twit.get('friends/ids', { user_id: randFollower })
  const target = this.randIndex(friends)
  return this.twit.post('friendships/create', { id: target })
}

//
//  follow someone new by searching for relevant tweets
//
Bot.prototype.searchFollow = async function (params) {
  const { statuses: tweets } = await this.twit.get('search/tweets', params)
  const target = this.randIndex(tweets).user.id_str
  const response = await this.twit.post('friendships/create', { id: target })
  return response
}

//
//  prune your followers list; unfollow a friend that hasn't followed you back
//
Bot.prototype.prune = async function () {
  const { ids: followers } = await this.twit.get('followers/ids', { screen_name: this.screen_name })
  const { ids: friends } = await this.twit.get('friends/ids', { screen_name: this.screen_name })
  let pruned = false
  while (!pruned) {
    const target = this.randIndex(friends)
    if (!~followers.indexOf(target)) {
      pruned = true
      return this.twit.post('friendships/destroy', { id: target })
    }
  }
}

//
// favorite a tweet
//
Bot.prototype.favorite = async function (params) {
  const { statuses: tweets } = await this.twit.get('search/tweets', params)
  const randomTweet = this.randIndex(tweets)
  return this.twit.post('favorites/create', { id: randomTweet.id_str })
}

// check for duplicate tweets in recent timeline
Bot.prototype.isDuplicate = function (text, tweets) {
  return (tweets || this.cache).some(tweet => {
    if (tweet.text === text) {
      return true
    // checks for same URL (helpful if you disable shorteners)
    } else if (tweet.text.split('http')[1] === text.split('http')[1]) {
      return true
    } else if (tweet.url && text.split('http')[1] === tweet.url.split('http')[1]) {
      return true
    } else {
      return false
    }
  })
}

Bot.prototype.randIndex = function (arr) {
  const index = Math.floor(arr.length * Math.random())
  return arr[index]
}
