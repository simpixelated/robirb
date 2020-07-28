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
- [ ] create tweet queue file if it does not exist
- [ ] incorporate methods from flickr-faves-from-gallery
- [ ] convert flickr.js to async/await
- [ ] convert bot.js to async/await
- [ ] implement retweet action