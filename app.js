//Set up http analytics
require('pmx').init({
  http : true
});
var express   = require('express');
var app       = express();
var cors      = require('cors');
var request   = require('request');
var _         = require('lodash');
var LocalService = require('./local-service');
var GooglePlayService = require('./google-service');
var DispatchService = require('./dispatch-service');

//http://cdn1.tnwcdn.com/wp-content/blogs.dir/1/files/2013/11/Winampmain.png


app.use(require('express-domain-middleware'));

app.get('/token', cors(), function (req, res) {
  DispatchService.getToken(req.query.source,req.query)
    .then(d => res.send(d))
    .catch(e => res.send({error: 'Login unsuccessful'}));
});


app.get('/library', cors(), function (req, res) {
  DispatchService.loadLibrary(req.query.source,req.query.token)
    .then(d => res.send(d));
});

app.get('/stream/url/:id', cors(), function (req, res) {
  DispatchService.streamUrl(req.query.source,req.query.token,req.params.id)
    .then(d => res.send(d));
});

app.get('/count/:id', cors(), function (req, res) {
  DispatchService.incrementPlayCount(req.query.source,req.query.token, req.params.id)
    .then(d => res.send({status: d}));
});

app.get('/stream/data', cors(), function (req, res) {
  req.pipe(request(req.query.url)).pipe(res);
});



app.get('/library/clear', cors(), function (req, res) {
  GooglePlayService.clearCache(req.query.token, d => res.send({status: d}));
});

app.get('/library/raw', cors(), function (req, res) {
  GooglePlayService.rawLibrary(req.query.token, d => res.send(d));
});

app.get('/check',function(req,res) {
  res.send("OK");
});

app.get('/tracks',function(req,res) {
  LocalService.uploadTrack(d => res.send(d));
});

app.listen(3000, function () {
  console.log('Cloudamp is listening on port 3000!');
});