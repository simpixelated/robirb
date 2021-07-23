const fs = require('fs')
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

  try {
    console.log(`Fetching tweets for ${bot.screen_name} to help prevent duplicates...`)
    await bot.populateCache()
  } catch (err) {
    handleError(err, '\nfailed to get timeline')
  }

  // create tweets from Flickr photos
  try {
    const names = JSON.parse(fs.readFileSync('./data/flickr-twitter-usernames.json'))
    let photos = []
    if (config.flickr.user_id) {
      console.log(`getting Flickr favorites for ${config.flickr.user_id}`)
      photos = await flickr.getFavoritePhotosForUser(config.flickr.user_id)
    } else {
      photos = await flickr.getPhotos(config.keyword)
    }
    const tweets = photos.map((photo) => {
      const social = names[photo.ownername]
      let name = photo.ownername
      if (social) {
        name = Object.keys(social).map(network => `@${social[network]} (${network})`).join(' ')
      }
      return {
        text: `${photo.title} by ${name} ${photo.url}`,
        approved: false
      }
    })
    await bot.queueTweets(tweets)
  } catch (error) {
    handleError(error)
  }

  // all possible actions to take
  const actions = [
    {
      description: 'tweet from queue',
      execute: async () => {
        const reply = await bot.tweetFromQueue()
        if (reply) {
          console.log('Tweet: ' + (reply ? reply.text : reply))
        } else {
          takeAction()
        }
      }
    },

    {
      description: 'follow someone in network',
      execute: async () => {
        const reply = await bot.mingle()
        if (reply && reply.screen_name) {
          console.log(`Mingle: followed @${reply.screen_name}`)
        }
      }
    },

    {
      description: 'search for someone new to follow',
      execute: async () => {
        const params = {
          q: config.keyword,
          result_type: 'mixed',
          lang: 'en'
        }
        const reply = await bot.searchFollow(params)
        if (reply && reply.screen_name) {
          console.log(`SearchFollow: followed @${reply.screen_name}`)
        }
      }
    },

    {
      description: 'unfollow non-follower.',
      execute: async () => {
        const reply = await bot.prune()
        if (reply && reply.screen_name) {
          console.log(`Prune: unfollowed @${reply.screen_name}`)
        }
      }
    },

    {
      description: 'favorite a tweet',
      execute: () => bot.favorite({
        q: `${config.keyword}%20-filter%3Aretweets`,
        result_type: 'mixed',
        count: 50,
        lang: 'en'
      })
    }
  ]

  console.log(`Running Twitter behavior every ${interval} seconds...`)
  const takeAction = async () => {
    const randomNumber = randomInt(0, actions.length - 1)
    const action = actions[randomNumber]
    try {
      await action.execute()
    } catch (error) {
      console.error(`Failed to: ${action.description}`)
      handleError(error)
    }
  }

  takeAction()
  setInterval(takeAction, interval * 1000)
}

start()
