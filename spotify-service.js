var SpotifyWebApi = require('spotify-web-api-node');
var _             = require('lodash');
var RSVP          = require('rsvp');
var fs = require('fs');

var SpotifyService = {
  getSpotify() {
    var spotify = new SpotifyWebApi({
      clientId    : 'bb0936b2d148469593ae174953e02e98',
      clientSecret: '1da18e7e436f444e8a56e5363039c470',
      redirectUri : 'http://localhost:4200/auth/spotify'
    });
    return spotify;
  },
  getToken(data) {
    var spotify = this.getSpotify();
    return spotify.authorizationCodeGrant(data.code)
      .then(d => {
        return {
          token       : d.body.access_token,
          refreshToken: d.body.refresh_token
        };
      })
      .catch(e => {
        console.error(e);
        return e;
      });
  },
  processLibrary(lib) {
    var tracks = this.parseTracks(lib);
    var artists = _.groupBy(tracks,'artist');
    var r = _.map(artists, artist => {
      //For each artist
      var albums = _.map(_.groupBy(artist,'album'),(tracks) => {
        var album = {
          "name": _.head(tracks).album,
          "duration": 1,
          "genre": "",
          "image": "",
          "played": 1,
          "tracksCount": 1,
          "year": "3030",
          "tracks": tracks
        };
        return album;
      });
      return {
        "name": _.head(artist).artist,
        "albums": albums,
        "albumsCount": "",
        "duration": 3,
        "genre": "",
        "image": "",
        "played": "",
        "tracksCount": 1
      }
    });
    return {
      "artists": r,
      "artistsCount": 1
    };
  },
  parseTracks(tracks) {
    return _.map(tracks, item => {
      var artist = _.map(item.track.artists, a => {
        return a.name
      });
      console.log(item);
      return {
        "name": item.track.name,
        "track": item.track.name,
        "album": item.track.album.name,
        "artist": _.head(artist),
        "duration": item.track.duration_ms,
        "genre": "",
        "id": item.track.id,
        "image": _.head(item.track.album.images).url,
        "played": 0,
        "trackNum": item.track.track_number,
        "year": "3030"
      };
    });
  },
  loadLibrary(token) {
    var spotify = this.getSpotify();
    spotify.setAccessToken(token);
    return spotify.getMySavedTracks(token)
      .then(d => {
        return this.processLibrary(d.body.items);
      })
      .catch(e => {
        console.error(e);
      });
    //return new RSVP.Promise(cb => {
    //  fs.readFile("/tmp/spotify.json",(e,d) => {
    //    console.log(e);
    //    console.log(d);
    //    cb(this.processLibrary(d.body.items));
    //  });
    //})
  }
};

module.exports = SpotifyService;