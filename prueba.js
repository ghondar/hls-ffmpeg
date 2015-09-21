var hf = require('./hls-ffmpeg');
var path = require('path');
var fse = require('fs-extra');
var fs = require('fs');

var output = path.join(__dirname, 'output', 'prueba')

var formats = [{
  input: 'videoAhora.mov',
  ext: 'mov',
  quality: '360p',
  format: '640x360'
},{
  input: 'videoAhora.mov',
  ext: 'mov',
  quality: '480p',
  format: '848x480'
},{
  input: 'videoAhora.mov',
  ext: 'mov',
  quality: '720p',
  format: '1280x720'
},{
  input: 'videoAhora.mov',
  ext: 'mov',
  quality: '1080p',
  format: '1920x1080'
}];

var count = 0;
var hlsCount = 0;

formats.forEach(function(format){
  format.name = format.input.split('.'+format.ext)[0];
  var pathVideo = path.join(output, format.name);
  var m3u8 = path.join(pathVideo, format.name + '.m3u8');
  var bandwidth = '';
  switch(format.quality){
    case '360p':
      bandwidth = '1000000';
      break;
    case '480p':
      bandwidth = '1466589';
      break;
    case '720p':
      bandwidth = '2000000'
      break;
    case '1080p':
      bandwidth = '3000000'
      break;
  }
  fse.mkdirsSync(pathVideo);
  if(count == 0){
    format.splash = 'imagen.png'
    format.thumbnail = 'imagen-thumbnail.png'
    format.output = path.join(pathVideo, format.name +'.mp4'); 
    hf.ffmpeg(format, function(err, data){
      // console.log(err||data)
      console.log('historial', 1)
      var json = {
        input: format.output,
        time: '10',
        output: path.join(pathVideo, format.quality)
      }
      hf.hls(json, function(err, data){
        // console.log(err||data);
        console.log('historial', 2)
        append({
          path: m3u8,
          pl: path.join(format.quality, 'pl.m3u8'),
          bandwidth: bandwidth,
          format: format.format
        })
        hlsCount ++;
        if(hlsCount === formats.length){
          console.log('historial', 'ultimo')
        }
        if(count === formats.length)
          count = 0;
      })
    })
  }else{
    format.output = path.join(pathVideo, format.name + '-'+ format.quality +'.mp4');
    hf.ffmpeg(format, function(err, data){
      // console.log(err||data)
      console.log('historial', 3)
      var json = {
        input: format.output,
        time: '10',
        output: path.join(pathVideo, format.quality)
      }
      hf.hls(json, function(err, data){
        // console.log(err||data);
        console.log('historial', 4)
        append({
          path: m3u8,
          pl: path.join(format.quality, 'pl.m3u8'),
          bandwidth: bandwidth,
          format: format.format
        });
        hlsCount ++;
        if(hlsCount === formats.length){
          console.log('historial', 'ultimo')
        }
        if(count === formats.length)
          count = 0;
      })
    })
  }
  count++;
})

function append(json){
  var text = '#EXT-X-STREAM-INF:BANDWIDTH=' + json.bandwidth + ',RESOLUTION=' + json.format + ',CODECS="avc1.4d401f,mp4a.40.5"\n';
  text += json.pl + '\n';
  if(!fs.existsSync(json.path)){
    var prefix = '#EXTM3U\n';
    prefix += text;
    fs.writeFileSync(json.path, prefix);
  }else
    fs.appendFileSync(json.path, text);
}
