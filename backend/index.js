const express = require('express');
const axios = require('axios');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const albumArt = require('album-art');
const net = require('net');
const app = express();
var path = require("path");
const port =  8000;

var exec = require('child_process').exec, child;

async function getAlbumJson(id) {
  var url = `http://coverartarchive.org/release/${id}/`;
  console.log(url);
  return axios.get(url)
    .then((response) => {
      return JSON.parse(JSON.safeStringify(response)).data.images[0].image;
    });
}

async function getAlbumArt(artist, track) {
  artist = artist.replace(/ /g,"-");
  track = track.replace(/ /g,"-");
  var url = `http://musicbrainz.org/ws/2/recording/?query=artist:${artist}+recording:${track}`;
  console.log(url);
  
  return axios.get(url)
    .then((response) => {
      return JSON.parse(JSON.safeStringify(response)).data.recordings;
    })
    .then((recordings) => {
      return recordings[0].releases[0].id;
    })
    .then(async (id) => {
      var albuminfo = await getAlbumJson(id)
      return albuminfo;
    }).catch((err)=>{console.log("Error retrieving album art")});
    
}

async function  getCurrentSong(req,res) {
    var client = new net.Socket();
    client.connect(6600, '127.0.0.1', () => {
      console.log("Getting track data...");
      client.write('currentsong\n');
    });
    client.on('data', async (data) => {
      var str = data.toString().split("\n");
      str.splice(0, 1);
      str.splice(str.length - 2, 2);
      
      var songInfo = {};
      str.forEach((line, i) => {
        var segments = line.split(": ");
        var key = segments[0];
        var val = segments[1];
        songInfo[key] = val;
      });
      client.destroy();
      console.log(songInfo);
      var art = await getAlbumArt(songInfo.Artist, songInfo.Title);
      songInfo["Art"] = art;
      res.json(songInfo);
    });
   
}

JSON.safeStringify = (obj, indent = 2) => {
  let cache = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === "object" && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent
  );
  cache = null;
  return retVal;
};

  

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', (req,res) => res.sendFile(path.join(__dirname + '/views/index.html')));
app.get('/date', (req,res) => res.send(`${Date.now()}`));
app.get('/nowplaying', async (req,res) => {await getCurrentSong(req,res)});
app.get('/test', async (req,res) => {await getAlbumArt(req,res)});

app.listen(port, "127.0.0.1");
