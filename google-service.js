var PlayMusic = require('./playmusic');
var _         = require('lodash');
var RSVP      = require('rsvp');

//http://cdn1.tnwcdn.com/wp-content/blogs.dir/1/files/2013/11/Winampmain.png

var cache = {};

var GooglePlayService = {
  /**
   * Takes an artist and groups by albums and tracks
   * @param artistTracks Array of tracks for an artist
   */
  formatArtist(artistTracks) {
    if (_.isEmpty(artistTracks)) {
      return {name: 'Empty'};
    }
    var albumTracks = _.toArray(_.groupBy(artistTracks, 'album'));
    var albums      = _.map(albumTracks, tracks => {

      var parsedTracks = tracks.map(track => {
        return {
          name    : track.title,
          duration: parseInt(track.durationMillis),
          trackNum: track.trackNumber,
          played  : track.playCount || 0,
          id      : track.nid,
          genre   : track.genre
        }
      });

      return {
        name       : _.head(tracks).album,
        tracksCount: tracks.length,
        year       : _.head(tracks).year,
        genre      : _.head(tracks).genre,
        image      : _.head(tracks).albumArtRef[0].url,
        duration   : _.reduce(tracks, (sum, n) => sum + parseInt(n.durationMillis), 0),
        played     : _.reduce(parsedTracks, (sum, n) => sum + n.played,0),
        tracks     : parsedTracks
      };
    });

    return {
      name       : _.head(artistTracks).artist,
      genre      : _.head(artistTracks).genre,
      image      : _.head(artistTracks).artistArtRef[0].url,
      albumsCount: albums.length,
      tracksCount: _.reduce(albums, (sum, n) => sum + n.tracksCount, 0),
      duration   : _.reduce(albums, (sum, n) => sum + n.duration, 0),
      played     : _.reduce(albums, (sum, n) => sum + n.played, 0),
      albums     : albums
    };
  },
  /**
   * Builds the library from the raw GPM JSON and turns into generic artist data
   * @param library Raw GPM JSON
   * @returns Generalize list of artist data
   */
  buildLibrary(library) {
    var artistGrouped = _.toArray(_.groupBy(library, 'albumArtist'));
    var artist        = artistGrouped.map(this.formatArtist);
    return {
      'artistCount': artist.length,
      'artists'    : artist
    };
  },
  loadTracks(pm, accu, npt, cb) {
    var opts = {};
    if (npt) {
      opts.nextPageToken = npt;
    }
    pm.getAllTracks(opts, (err, library) => {
      if (library && library.data && library.data.items) {
        var t = _.concat(accu, library.data.items);
        if (library.nextPageToken) {
          this.loadTracks(pm, t, library.nextPageToken, cb);
        } else {
          cb(_.flatten(t));
        }
      }
    })
  },
  rawLibrary(token,cb) {
    this.getPlayMusic({masterToken: token}, pm => {
      this.loadTracks(pm,[],null,d => {
        cb(d);
      })
    })
  },
  getPlayMusic(auth, cb) {
    var pm = new PlayMusic();
    pm.init(auth, err => {
      if (err) console.error(err);
      cb(pm);
    });
  },
  clearCache(token,cb) {
    delete cache[token];
    cb('ok');
  },
  //Below here is the public api for google
  loadLibrary(token) {
    return new RSVP.Promise(cb => {
      if (cache[token]) {
        console.log('cache hit');
        cb(cache[token]);
      } else {
        this.getPlayMusic({masterToken: token}, pm => {
          this.loadTracks(pm, [], null, d => {
            var built    = this.buildLibrary(d);
            cache[token] = built;
            cb(built);
          });
        })
      }
    });
  },
  getToken(user, pass) {
    var pm = new PlayMusic();
    return new RSVP.Promise(cb => {
      pm.init({email: user, password: pass}, t => {
        cb(t.Token);
      });
    });
  },
  streamUrl(token, id) {
    return new RSVP.Promise(cb => {
      this.getPlayMusic({masterToken: token}, pm => {
        pm.getStreamUrl(id, (e, url) => {
          cb(url);
        })
      })
    });
  },
  incrementPlayCount(token,id) {
    return new RSVP.Promise(cb => {
      this.getPlayMusic({masterToken: token}, pm => {
        pm.incrementTrackPlaycount(id, r => {
          cb(true);
        })
      })
    });
  },
  streamData(url) {

  }
};

module.exports = GooglePlayService;