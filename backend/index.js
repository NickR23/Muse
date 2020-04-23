const express = require('express');
const albumArt = require('album-art');
const net = require('net');
const app = express();
var path = require("path");
const port =  8000;

var exec = require('child_process').exec, child;

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
      var art;
      albumArt(songInfo.Artist, {album: songInfo.Album}, async (error, response) => {
        if (error) {
          art = albumArt(songInfo.Artist);
        }
        art = response;
      });

      if (art == null) {
        art = await albumArt(songInfo.Artist);
      }
      res.json({"name": songInfo.Title, "art": art});
    });
   
}
  

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', (req,res) => res.sendFile(path.join(__dirname + '/views/index.html')));
app.get('/date', (req,res) => res.send(`${Date.now()}`));
app.get('/nowplaying', async (req,res) => {await getCurrentSong(req,res)});

app.listen(port, '192.168.0.25');
