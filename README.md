twitterbot
==========

Twitterbot that runs on Node.js

### Usage
1. Create your own `config.js` using `config.sample.js` as an example. Then, start it like a normal node app:

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
- [ ] incorporate flickr-faves-from-gallery
- [ ] eliminate "this" and "prototype"
- [x] update dependencies
  - [x] update to flickr-sdk
  - [x] update to twitter SDK
- [x] reduce/remove usage of _
- [x] enable "dev" mode which does not submit data to Twitter

