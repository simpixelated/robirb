robirb
==========

Twitterbot that runs on Node.js. Creates tweets from Flickr photos, follows/unfollows, and more.

### Usage

You will need a [Twitter developer app](https://developer.twitter.com/en/apps) and the access tokens for a user authenticated with your app.

1. Create your own `config.js` using `config.sample.js` as an example.
1. Start it like a normal node app:
```
npm install
npm start
```

TODO:
- [x] create tweet queue file if it does not exist
- [x] incorporate methods from flickr-faves-from-gallery
- [x] convert flickr.js to async/await
- [x] convert bot.js to async/await
- [x] do better string comparison to avoid duplicate tweets
- [ ] implement retweet action
- [ ] add option to post queue to external source (like Google sheets)