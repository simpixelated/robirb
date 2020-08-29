robirb
==========

Twitterbot that runs on Node.js

### Usage
1. Create your own `config.js` using `config.sample.js` as an example.
1. Create a tweet queue file for each user (`data/tweetQueue-[username].json`).
1. Start it like a normal node app:
```
npm install
npm start
```

TODO:
- [x] create tweet queue file if it does not exist
- [x] incorporate methods from flickr-faves-from-gallery
- [x] convert flickr.js to async/await
- [ ] convert bot.js to async/await
- [ ] implement retweet action
- [ ] do better string comparison to avoid duplicate tweets