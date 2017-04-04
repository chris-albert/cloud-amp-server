var LocalService      = require('./local-service');
var GooglePlayService = require('./google-service');
var SpotifyService = require('./spotify-service');
var TidalService = require('./tidal-service');

module.exports = {
  getToken(type, data) {
    return this.getService(type).getToken(data);
  },
  loadLibrary(type, token, options) {
    return this.getService(type).loadLibrary(token, options);
  },
  streamUrl(type, token, id) {
    return this.getService(type).streamUrl(token, id);
  },
  incrementPlayCount(type, token, id) {
    console.log("here: " + type + ": " + id);
    return this.getService(type).incrementPlayCount(token, id);
  },
  getService(type) {
    console.log(type);
    switch (type) {
      case 'google':
        return GooglePlayService;
      case 'cloudamp':
        return LocalService;
      case 'spotify':
        return SpotifyService;
      case 'tidal':
        return TidalService;
      default:
        console.error('Don\'t know about service [' + type + ']');
    }
  }
};