var hf = require('./hls-ffmpeg');

var json = {
  input: 'test.mov',
  time: '10'
}

hf.hls(json, function(err, data){
  console.log(err||data);
})

// var json1 = {input: './test.mp4',format: '848x480', output: './output/test.mp4'}

// hls.ffmpeg(json1, function(err, data){
//   console.log(err||data)
// })