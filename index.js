const Bot = require('./bot')
const config = require('./config')
const Flickr = require('./flickr')

const randomInt = (a = 1, b = 0) => {
  const lower = Math.ceil(Math.min(a, b))
  const upper = Math.floor(Math.max(a, b))
  return Math.floor(lower + Math.random() * (upper - lower + 1))
}

const handleError = (err, attempt) => {
  if (attempt) {
    console.error(attempt)
  }
  console.error(err,
    `response status: ${err.statusCode}
    data: ${err.data}`
  )
}

const start = async (interval = 120, devMode = false) => {
  const bot = new Bot(config.twitter, devMode)
  const flickr = new Flickr(config.flickr)

  console.log(`Fetching tweets for ${bot.screen_name} to help prevent duplicates...`)
  bot.twit.get('statuses/user_timeline', { screen_name: bot.screen_name }, (err, statuses) => {
    if (err) return handleError(err, '\nfailed to get timeline')
    bot.cache = statuses
  })

  // create tweets from Flickr photos
  try {
    let photos = []
    if (config.flickr.user_id) {
      console.log(`getting Flickr favorites for ${config.flickr.user_id}`)
      photos = await flickr.getFavoritePhotosForUser(config.flickr.user_id)
    } else {
      photos = await flickr.getPhotos(config.keyword)
    }
    const tweets = photos.map((photo) => ({
      text: `${photo.title} by ${photo.ownername} ${photo.url}`,
      approved: false
    }))
    bot.queueTweets(tweets, (err, resp) => {
      if (err) return handleError(err)
      console.log(resp)
    })
  } catch (error) {
    handleError(error)
  }

  // all possible actions to take
  const actions = [
    // tweet from queue
    () => {
      console.log('Attempting to tweet from queue...')
      bot.tweetFromQueue((error, reply) => {
        if (error) {
          handleError(error)
          return takeAction()
        }
        console.log('\nTweet: ' + (reply ? reply.text : reply))
      })
    },

    // post an "original" tweet using a popular (based on retweets) tweet from search
    () => {
      console.log('Would retweet from search, but that\'s not ready yet :(')
      takeAction()
      // TODO
      // const params = {
      //   q: config.keyword,
      //   result_type: 'mixed',
      //   lang: 'en'
      // }
    },

    // follow a friend of a friend
    () => {
      console.log('Attempting to follow someone in network...')
      bot.mingle((err, reply) => {
        if (err) return handleError(err)
        if (reply && reply.screen_name) {
          console.log(`\nMingle: followed @${reply.screen_name}`)
        }
      })
    },

    // find someone new to follow
    () => {
      const params = {
        q: config.keyword,
        result_type: 'mixed',
        lang: 'en'
      }
      console.log('Attempting to follow someone new...')
      bot.searchFollow(params, (err, reply) => {
        if (err) return handleError(err)
        if (reply && reply.screen_name) {
          console.log(`\nSearchFollow: followed @${reply.screen_name}`)
        }
      })
    },

    // remove a follower that doesn't follow you
    () => {
      console.log('Attempting to remove a follower that is now following...')
      bot.prune((err, reply) => {
        if (err) return handleError(err)
        if (reply && reply.screen_name) {
          console.log(`\nPrune: unfollowed @${reply.screen_name}`)
        }
      })
    }
  ]

  console.log(`Running Twitter behavior every ${interval} seconds...`)
  const takeAction = () => actions[randomInt(0, actions.length - 1)]()
  takeAction()
  setInterval(takeAction, interval * 1000)
}

start()
