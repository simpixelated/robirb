const Flickr = require('flickr-sdk')
const _ = require('lodash')

const flickr = function (config) {
  this.cache = []
  this.config = config
  this.api = new Flickr(config.api_key)

  // get a bunch of photos via keyword
  this.getPhotos = async (query) => {
    const response = this.api.photos.search({ text: query.replace(/\s/g, '+'), extras: 'owner_name' })
    return response.body.photos.photo.map(augmentPhoto)
  }

  // get a single photo, either from cache or new call
  this.getPhoto = async (query) => {
    if (this.cache.length) {
      return this.cache.pop()
    } else {
      const response = this.api.photos.search({ text: query.replace(/\s/g, '+') })
      this.cache = _.shuffle(response.body.photos.photo).map(augmentPhoto)
      return this.cache.pop()
    }
  }

  // get all favorite photos from a single user
  this.getFavoritePhotosForUser = async (userId) => {
    const response = await this.api.favorites.getPublicList({ user_id: userId, extras: 'owner_name', per_page: 500 })
    return response.body.photos.photo.map(augmentPhoto)
  }
}

const augmentPhoto = (flickrPhoto) => ({
  ...flickrPhoto,
  url: `https://www.flickr.com/photos/${flickrPhoto.owner}/${flickrPhoto.id}`
})

module.exports = flickr
