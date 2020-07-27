const _ = require('lodash-node')

const Bot = require('./bot')
const config = require('./config')
const bot = new Bot(config.twitter)
const Flickr = require('./flickr')

const interval = 120000
const started = new Date()
const flickr = new Flickr(config.flickr)

const start = () => {
  console.log(`fetching tweets for ${bot.screen_name} to help prevent duplicates`)
  bot.twit.get('statuses/user_timeline', { screen_name: bot.screen_name }, (err, statuses) => {
    if (err) return handleError(err, '\nfailed to get timeline')
    bot.cache = statuses
  })

  // create tweets from Flickr photos
  flickr.getPhotos(config.keyword, (err, photos) => {
    if (err) return handleError(err)
    const tweets = photos.map((photo) => ({
      text: `${photo.title} ${photo.url}`,
      approved: false
    }))
    bot.queueTweets(tweets, (err, resp) => {
      if (err) return handleError(err)
      console.log(resp)
    })
  })

  console.log(`running Twitter behavior every ${interval / 1000} seconds...`)
  setInterval(() => {
    const rand = Math.random()

    // post an "original" tweet using a popular (based on retweets) tweet from search
    if (rand <= 0.10) {
      bot.tweetFromQueue((error, reply) => {
        if (error) return handleError(error)
        console.log('\nTweet: ' + (reply ? reply.text : reply))
      })

      // retweet from search
    } else if (rand <= 0.20) {
      console.log('Would retweet from search, but that\'s not ready yet...')
      // TODO
      // const params = {
      // 		q: config.keyword,
      // 		result_type: 'mixed',
      // 		lang: 'en'
      // 	};

      // follow someone new
    } else if (rand <= 0.70) {
      if (Math.random() <= 0.50) {
        bot.mingle((err, reply) => {
          if (err) return handleError(err, '\ntried to mingle')
          console.log(`\nMingle: followed @${reply.screen_name}`)
        })
      } else {
        const params = {
          q: config.keyword,
          result_type: 'mixed',
          lang: 'en'
        }
        bot.searchFollow(params, (err, reply) => {
          if (err) return handleError(err, '\ntried to searchFollow')
          console.log(`\nSearchFollow: followed @${reply.screen_name}`)
        })
      }
    } else {
      // remove a follower that doesn't follow you
      bot.prune((err, reply) => {
        if (err) return handleError(err, '\ntried to unfollow')
        console.log(`\nPrune: unfollowed @${reply.screen_name}`)
      })
    }
  }, interval)
}

const handleError = (err, attempt) => {
  if (attempt) {
    console.error(attempt)
  }
  console.error(
		`${err}
		response status: ${err.statusCode}
		data: ${err.data}`
  )
}

start()
