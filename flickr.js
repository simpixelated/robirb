const Flickr = require('flickr-sdk')
const _ = require('lodash')

const flickr = function (config) {
  this.cache = []
  this.config = config
  this.api = new Flickr(config.api_key)

  // get a bunch of photos via keyword
  this.getPhotos = function (query, callback) {
    this.api.photos.search({ text: query.replace(/\s/g, '+') })
      .then((response) => {
        const photos = response.body.photos.photo.map(augmentPhoto)
        return callback(null, photos)
      })
      .catch(err => callback(err))
  }

  // get a single photo, either from cache or new call
  this.getPhoto = function (query, callback) {
    const self = this
    let photo
    if (this.cache.length) {
      photo = this.cache.pop()
      return callback(undefined, photo)
    } else {
      this.api.photos.search({ text: query.replace(/\s/g, '+') })
        .then((response) => {
          self.cache = _.shuffle(response.body.photos.photo).map(augmentPhoto)
          photo = self.cache.pop()
          return callback(null, photo)
        })
        .catch(err => callback(err))
    }
  }
}

const augmentPhoto = (flickrPhoto) => ({
  ...flickrPhoto,
  url: `https://www.flickr.com/photos/${flickrPhoto.owner}/${flickrPhoto.id}`
})

module.exports = flickr
