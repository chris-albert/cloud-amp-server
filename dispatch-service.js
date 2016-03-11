var LocalService      = require('./local-service');
var GooglePlayService = require('./google-service');

module.exports = {
  getToken(type, user, pass) {
    return this.getService(type).getToken(user, pass);
  },
  loadLibrary(type, token) {
    return this.getService(type).loadLibrary(token);
  },
  streamUrl(type, token, id) {
    return this.getService(type).streamUrl(token, id);
  },
  incrementPlayCount(type, token, id) {
    console.log("here: " + type + ": " + id);
    return this.getService(type).incrementPlayCount(token, id);
  },
  getService(type) {
    switch (type) {
      case 'google':
        return GooglePlayService;
      case 'cloudamp':
        return LocalService;
      default:
        console.error('Don\'t know about service [' + type + ']');
    }
  }
};