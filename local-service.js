var AWS  = require('aws-sdk');
var _    = require('lodash');
var UUID = require('node-uuid');
var RSVP = require('rsvp');

var publicAccessKey = 'AKIAJC677EUQHIRMS2FA';
var publicSecretKey = '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';

AWS.config.region = 'us-west-1';
var s3bucket      = new AWS.S3({
  params         : {
    Bucket: 'io.cloudamp'
  },
  accessKeyId    : publicAccessKey,
  secretAccessKey: publicSecretKey
});

var dynamoDB = new AWS.DynamoDB({
  accessKeyId    : publicAccessKey,
  secretAccessKey: publicSecretKey
});

var cloudAmpTable = 'cloudamp_media';

module.exports = {
  loadLibrary(token) {
    return new RSVP.Promise(cb => {
      dynamoDB.scan({TableName: cloudAmpTable}, (e, d) => {
        console.log(e);
        if (d) {
          d = this.buildLibrary(d.Items);
        }
        cb(d);
      })
    });
  },
  getToken(user, pass) {
    return new RSVP.Promise(cb => {
      if (user === 'default' && pass === 'default') {
        cb(UUID.v4());
      }
    });
  },
  streamUrl(token, id) {
    return new RSVP.Promise(cb => {
      cb({
        token: token,
        url  : 'https://s3-us-west-1.amazonaws.com/io.cloudamp/media/' + id + '.mp3'
      });
    });
  },
  incrementPlayCount(token, id) {
    var params = {
      TableName                : cloudAmpTable,
      Key                      : {
        "id": {
          "S": id
        }
      },
      UpdateExpression         : "set played = played + :val",
      ExpressionAttributeValues: {
        ":val": {
          "N": "1"
        }
      },
      ReturnValues             : "UPDATED_NEW"
    };
    return new RSVP.Promise((cb, eb) => {
      dynamoDB.updateItem(params, (e, d) => {
        if (d) {
          cb(true)
        }
        if (e) {
          eb(e);
        }
      })
    })
  },
  buildLibrary(items) {
    var tracks  = _.map(items, item => {
      return this.getTrackInfo(item);
    });
    var artists = _.map(_.groupBy(tracks, 'artist'), artists => {
      var albums = _.map(_.groupBy(artists, 'album'), album => {
        var tracks = _.map(album, track => {
          track.name = track.track;
          track.duration = parseInt(track.duration);
          track.trackNum = parseInt(track.trackNum);
          track.played = parseInt(track.played);
          return track;
        });
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
        name       : _.head(artists).artist,
        genre      : _.head(artists).genre,
        image      : _.head(artists).image,
        albumsCount: albums.length,
        tracksCount: _.reduce(albums, (sum, n) => sum + n.tracksCount, 0),
        duration   : _.reduce(albums, (sum, n) => sum + n.duration, 0),
        played     : _.reduce(albums, (sum, n) => sum + n.played, 0),
        albums     : albums
      };
    });
    return {
      artistsCount: artists.length,
      artists     : artists
    };
  },
  getTrackInfo(d) {
    return _.fromPairs(_.map(d, (v, k) => {
      if (v.S) {
        return [k, v.S];
      }
      if (v.N) {
        return [k, v.N];
      }
    }));
  },
  uploadTrack(cb) {
    _.map(this.generateTracks(), track => {
      dynamoDB.putItem({
        Item     : track,
        TableName: 'cloudamp_media'
      }, (e, d) => {
        console.log({error: e});
        console.log({status: d});
      });
    });
    cb('ok')
  },
  generateTracks() {
    return [
      {
        id      : {S: '1a05a1b8-252a-4554-9302-136ac842d383'},
        track   : {S: 'Blood & Bone'},
        album   : {S: 'Black Kaweah'},
        artist  : {S: 'Black Kaweah'},
        duration: {N: '278000'},
        year    : {N: '2014'},
        trackNum: {N: '1'},
        played  : {N: '0'},
        genre   : {S: 'Indie/Folk'},
        image   : {S: 'https://s3-us-west-1.amazonaws.com/io.cloudamp/images/15f02058-e42a-4f2b-ba24-ea97609573eb.png'}
      },
      {
        id      : {S: '3ae768c5-ade1-4ba7-94eb-778bdff74c95'},
        track   : {S: 'Oak Valley'},
        album   : {S: 'Black Kaweah'},
        artist  : {S: 'Black Kaweah'},
        duration: {N: '316000'},
        year    : {N: '2014'},
        trackNum: {N: '2'},
        played  : {N: '0'},
        genre   : {S: 'Indie/Folk'},
        image   : {S: 'https://s3-us-west-1.amazonaws.com/io.cloudamp/images/15f02058-e42a-4f2b-ba24-ea97609573eb.png'}
      },
      {
        id      : {S: '198fa0c9-416c-4a95-bfec-8b71f1823970'},
        track   : {S: 'Tripne Twins'},
        album   : {S: 'Black Kaweah'},
        artist  : {S: 'Black Kaweah'},
        duration: {N: '741000'},
        year    : {N: '2014'},
        trackNum: {N: '3'},
        played  : {N: '0'},
        genre   : {S: 'Indie/Folk'},
        image   : {S: 'https://s3-us-west-1.amazonaws.com/io.cloudamp/images/15f02058-e42a-4f2b-ba24-ea97609573eb.png'}
      },
      {
        id      : {S: '5784f2e4-0761-4974-8255-8d59438ceba2'},
        track   : {S: 'Ancestors'},
        album   : {S: 'Black Kaweah'},
        artist  : {S: 'Black Kaweah'},
        duration: {N: '368000'},
        year    : {N: '2014'},
        trackNum: {N: '4'},
        played  : {N: '0'},
        genre   : {S: 'Indie/Folk'},
        image   : {S: 'https://s3-us-west-1.amazonaws.com/io.cloudamp/images/15f02058-e42a-4f2b-ba24-ea97609573eb.png'}
      },
      {
        id      : {S: '1ec84a81-6119-4243-82c3-708da306aadb'},
        track   : {S: 'Everyone'},
        album   : {S: 'Black Kaweah'},
        artist  : {S: 'Black Kaweah'},
        duration: {N: '242000'},
        year    : {N: '2014'},
        trackNum: {N: '5'},
        played  : {N: '0'},
        genre   : {S: 'Indie/Folk'},
        image   : {S: 'https://s3-us-west-1.amazonaws.com/io.cloudamp/images/15f02058-e42a-4f2b-ba24-ea97609573eb.png'}
      },
      {
        id      : {S: 'bbbcb552-c530-4275-8636-dddf8d78aa15'},
        track   : {S: 'Native Names'},
        album   : {S: 'Black Kaweah'},
        artist  : {S: 'Black Kaweah'},
        duration: {N: '135000'},
        year    : {N: '2014'},
        trackNum: {N: '6'},
        played  : {N: '0'},
        genre   : {S: 'Indie/Folk'},
        image   : {S: 'https://s3-us-west-1.amazonaws.com/io.cloudamp/images/15f02058-e42a-4f2b-ba24-ea97609573eb.png'}
      },
      {
        id      : {S: '1020baa5-2961-4e5b-b433-9626f517cada'},
        track   : {S: 'Quaking Aspen\'s Eyes'},
        album   : {S: 'Black Kaweah'},
        artist  : {S: 'Black Kaweah'},
        duration: {N: '283000'},
        year    : {N: '2014'},
        trackNum: {N: '7'},
        played  : {N: '0'},
        genre   : {S: 'Indie/Folk'},
        image   : {S: 'https://s3-us-west-1.amazonaws.com/io.cloudamp/images/15f02058-e42a-4f2b-ba24-ea97609573eb.png'}
      },
      {
        id      : {S: 'e2894e7d-0ff4-4e47-9e3b-11e9ac981b3e'},
        track   : {S: 'The Incense Cedar'},
        album   : {S: 'Black Kaweah'},
        artist  : {S: 'Black Kaweah'},
        duration: {N: '528000'},
        year    : {N: '2014'},
        trackNum: {N: '8'},
        played  : {N: '0'},
        genre   : {S: 'Indie/Folk'},
        image   : {S: 'https://s3-us-west-1.amazonaws.com/io.cloudamp/images/15f02058-e42a-4f2b-ba24-ea97609573eb.png'}
      }
    ];
  }
};