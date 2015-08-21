var hf = require('./hls-ffmpeg');
var path = require('path');

// var json = {
//   input: 'test.mov',
//   time: '10'
// }

// hf.hls(json, function(err, data){
//   console.log(err||data);
// })


var output = path.join(__dirname, 'output')


var json1 = {
  input: 'test.mov',
  ext: 'mov',
  quality: '480p',
  format: '848x480'
}

json1.output = path.join(output, json1.input.split('.'+json1.ext)[0] + '-'+ json1.quality +'.mp4')

hf.ffmpeg(json1, function(err, data){
  console.log(err||data)
  var json = {
    input: json1.output,
    time: '10',
    output: path.join(output, json1.quality)
  }
  hf.hls(json, function(err, data){
    console.log(err||data);
  })
})

