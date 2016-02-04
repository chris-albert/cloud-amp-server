var express   = require('express');
var app       = express();
var cors      = require('cors');
var PlayMusic = require('./playmusic');
var _         = require('lodash');

//http://cdn1.tnwcdn.com/wp-content/blogs.dir/1/files/2013/11/Winampmain.png

var cache = null;

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
      return {
        name       : _.head(tracks).album,
        tracksCount: tracks.length,
        year       : _.head(tracks).year,
        genre       : _.head(tracks).genre,
        image      : _.head(tracks).albumArtRef[0].url,
        duration   : _.reduce(tracks, (sum, n) => sum + parseInt(n.durationMillis), 0),
        played  : _.reduce(tracks, (sum, n) => {
          var i = 0;
          try {
            i = parseInt(n.playCount)
          } catch (e) {}
          return sum + i
        },0),
        tracks     : tracks.map(track => {
          return {
            name    : track.title,
            duration: parseInt(track.durationMillis),
            trackNum: track.trackNumber,
            played  : track.playCount || 0,
            id      : track.nid,
            genre   : track.genre
          }
        })
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
    var artistGrouped = _.toArray(_.groupBy(library, 'artist'));
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
          cb(this.buildLibrary(_.flatten(t)));
        }
      }
    })
  },
  loadLibrary(res) {
    if (cache) {
      console.log('cache hit');
      res.send(cache);
    } else {
      this.getPlayMusic(pm => {
        this.loadTracks(pm, [], null, d => {
          cache = d;
          res.send(d)
        }); 
      })
    }
  },
  pm: null,
  getPlayMusic(cb) {
    if(this.pm) {
      cb(this.pm);
    } else {
      this.pm = new PlayMusic();
      this.pm.init({email: "", password: ""}, err => {
        if (err) console.error(err);
        cb(this.pm);
      }); 
    }
  },
  streamUrl(id,res) {
    this.getPlayMusic(pm => {
      pm.getStreamUrl(id,(e,url) => {
        res.send(url);
      })
    })
  }
};

app.options('*', cors());

app.get('/library', cors(), function (req, res) {
  GooglePlayService.loadLibrary(res);
});

app.get('/streamUrl/:id', cors(), function (req, res) {
  GooglePlayService.streamUrl(req.params.id,res);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});