var _       = require('lodash');
var request = require('request-promise');

var tidalBaseUrl = "https://api.tidalhifi.com/v1";

var TidalService = {
  getToken(data) {
    console.log(data);
    return this.request('POST','/login/username', {
      'X-Tidal-Token': 'wdgaB1CilGA-S_s2'
    }, {
      username: data.username,
      password: data.password
    })
      .then(d => {
        console.log(d);
        return {
          token: d.sessionId,
          userId: d.userId
        }
      });
  },
  albumTracks(albumId, token) {
    return this.request(
      'GET',
        '/albums/' + albumId + '/tracks',
      {'X-Tidal-SessionId': token},
      {
        countryCode: 'NL'
      });
  },
  loadLibrary(token, options) {
    return this.request(
      'GET',
      '/users/' + options.userId + '/favorites/albums',
      {'X-Tidal-SessionId': token},
      {
        limit: 9999,
        countryCode: 'NL'
    })
      .then(data => {
        return this.parseItems(data.items, token)
      });
  },
  tracksToArtists(tracks) {
    var artists = _.map(_.groupBy(tracks,'artist'), artist => {
      var albums = _.map(_.groupBy(artist,'album'), album => {
        var tracks = album;
        return {
          name       : _.head(tracks).album,
          tracksCount: tracks.length,
          year       : _.head(tracks).year,
          genre      : _.head(tracks).genre,
          image      : _.head(tracks).image,
          duration   : _.reduce(tracks, (sum, n) => sum + parseInt(n.duration), 0),
          played     : _.reduce(tracks, (sum, n) => sum + parseInt(n.played), 0),
          tracks     : tracks
        };
      });
      return {
        name       : _.head(artist).artist,
        genre      : _.head(artist).genre,
        image      : _.head(artist).image,
        albumsCount: albums.length,
        tracksCount: _.reduce(albums, (sum, n) => sum + n.tracksCount, 0),
        duration   : _.reduce(albums, (sum, n) => sum + n.duration, 0),
        played     : _.reduce(albums, (sum, n) => sum + n.played, 0),
        albums     : albums
      };
    });

    return {
      artistsCount: artists.length,
      artists: artists
    }
  },
  parseAlbumTracks(tracks) {
    return _.map(tracks, track => {
      return {
        id: track.id,
        name: track.title,
        album: track.album.title,
        artist: track.artist.name,
        duration: track.duration * 1000,
        trackNum: track.trackNumber,
        played: 0
      };
    });
  },
  parseItems(items,token) {
    var albumIds = _.map(items,item => {
      return item.item.id;
    });
    var all = _.map(albumIds,albumId => {
      return this.albumTracks(albumId, token)
        .then(d => {
          var parsed = this.parseAlbumTracks(d.items);
          return parsed;
        })
    });
    return Promise.all(all)
      .then(allTracks => {
        return this.tracksToArtists(_.flatten(allTracks));
      });
  },
  streamUrl(token, id) {
    return this.request(
      'GET',
      '/tracks/' + id + '/streamUrl',
      {'X-Tidal-SessionId': token},
      {
        soundQuality: "LOSSLESS"
      }
    )
      .then(d => {
        return {
          url: d.url
        };
      })
  },
  request(method, path, headers, params) {
    var opts = {};
    if(method === 'GET') {
      opts.qs = params;
    } else if(method === 'POST') {
      opts.form = params;
    }
    return request(_.merge({
      uri: (tidalBaseUrl + path),
      method: method,
      json: true,
      headers: headers
    },opts))
    .catch(e => {
      console.error('Error');
      console.error(e);
    });
  }
};

module.exports = TidalService;