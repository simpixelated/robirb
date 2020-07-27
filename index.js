const Bot = require('./bot')
const config = require('./config')
const bot = new Bot(config.twitter)
const Flickr = require('./flickr')

const flickr = new Flickr(config.flickr)

const randomInt = (a = 1, b = 0) => {
  const lower = Math.ceil(Math.min(a, b))
  const upper = Math.floor(Math.max(a, b))
  return Math.floor(lower + Math.random() * (upper - lower + 1))
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

const start = (interval = 120) => {
  console.log(`Fetching tweets for ${bot.screen_name} to help prevent duplicates...`)
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

  // all possible actions to take
  const actions = [
    // tweet from queue
    () => bot.tweetFromQueue((error, reply) => {
      if (error) return handleError(error)
      console.log('\nTweet: ' + (reply ? reply.text : reply))
    }),

    // post an "original" tweet using a popular (based on retweets) tweet from search
    () => {
      console.log('Would retweet from search, but that\'s not ready yet :(')
      // TODO
      // const params = {
      //   q: config.keyword,
      //   result_type: 'mixed',
      //   lang: 'en'
      // }
    },

    // follow a friend of a friend
    () => bot.mingle((err, reply) => {
      if (err) return handleError(err, '\ntried to mingle')
      console.log(`\nMingle: followed @${reply.screen_name}`)
    }),

    // find someone new to follow
    () => {
      const params = {
        q: config.keyword,
        result_type: 'mixed',
        lang: 'en'
      }
      bot.searchFollow(params, (err, reply) => {
        if (err) return handleError(err, '\ntried to searchFollow')
        console.log(`\nSearchFollow: followed @${reply.screen_name}`)
      })
    },

    // remove a follower that doesn't follow you
    bot.prune((err, reply) => {
      if (err) return handleError(err, '\ntried to unfollow')
      console.log(`\nPrune: unfollowed @${reply.screen_name}`)
    })
  ]

  console.log(`Running Twitter behavior every ${interval} seconds...`)
  setInterval(() => actions[randomInt(0, actions.length - 1)](), interval * 1000)
}

start()
