twitterbot
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

References:

* https://github.com/ttezel/twit
* https://github.com/Pomax/node-flickrapi
* http://www.apcoder.com/2013/10/03/twitter-bot-20-minutes-node-js/


TODO:
- [x] cleanup to match eslint (standard)
- [x] update dependencies
  - [x] update to flickr-sdk
  - [x] update to twitter SDK
- [x] reduce/remove usage of _
- [x] enable "dev" mode which does not submit data to Twitter
- [x] namespace tweet queue for multiple users
- [ ] create tweet queue file if it does not exist
- [ ] incorporate methods from flickr-faves-from-gallery
