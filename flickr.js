var FlickrAPI = require("flickrapi"),
	_ = require('lodash-node');

var flickr = function (config) {
	this.cache = [],
	this.config = config;
	this.getPhoto = function (query, callback) {
		var self = this,
			photo;

		if (this.cache.length) {
			photo = this.cache.pop();
			return callback(undefined, photo);
		} else {
			FlickrAPI.tokenOnly(this.config, function(err, api) {
				api.photos.search({ text: query.replace(/\s/g, '+') }, function(err, result) {
					self.cache = _.map(_.shuffle(result.photos.photo), function (flickrPhoto) {
						flickrPhoto.url = 'https://flic.kr/p/'+base58encode(flickrPhoto.id);
						return flickrPhoto;
					});
					photo = self.cache.pop();
					return callback(err, photo);
				});
			});			
		}
	}
};

// used to create the flickr short url which Twitter scrapes to dislay the photo in the timeline
function base58encode(num) {
    if (typeof num !== 'number') num = parseInt(num);
    var enc = '',
        alpha = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    var div = num,
        mod;
    while (num >= 58) {
        div = num / 58;
        mod = num - (58 * Math.floor(div));
        enc = '' + alpha.substr(mod, 1) + enc;
        num = Math.floor(div);
    }
    return (div) ? '' + alpha.substr(div, 1) + enc : enc;
}

module.exports = flickr;