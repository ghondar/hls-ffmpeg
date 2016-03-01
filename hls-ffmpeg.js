
/**
 * Module to drive ffmpeg video enconding library with shortcuts
 * for web video. Requires a  ffmpeg compiled with support for mp4/ogg/webm.
 */
var path = require('path'),
    _ = require('lodash'),
    child_process = require('child_process'),
    spawn = child_process.spawn,
    helpers = require('./helpers.js'),
    that = this,
    queue = exports.queue = [],
    maxActive = 10, // Maximum of active jobs
    active = 0;



function push (job) {
   queue.push(job);
   if(active < maxActive) {
      next();
   }
}

function next () {
   if(queue.length > 0 && active < maxActive) {
      that.exec(queue[0].bin, queue[0].params, queue[0].callback);
      active++;
      queue.shift();
   }
}

var formats = [{
  quality: '360p',
  format: '640x360'
},{
  quality: '480p',
  format: '848x480'
},{
  quality: '720p',
  format: '1280x720'
},{
  quality: '1080p',
  format: '1920x1080'
}]

/**
 * Description:
 *    calls ffmpeg or hls with the specified flags and returns the output
 *    to the callback function.
 *
 * Parameters:
 * bin - a string for execute 'ffmpeg' or './HLS-Stream-Creator.sh' 
 * params - an object of ffmpeg options, ex: {'-i': './test.3gp', '-vpre': ['slow', 'baseline'], '-vcodec': 'libx264'}
 * callback - a function to call when ffmpeg is done, ex:
 *    function (stderr, stdout, exitCode) { ... }
 */

exports.exec = function (bin, params, callback) {
   if (params instanceof Array && params.length > 1) {
      var stderr = '', stdout = '',
         objeto = spawn(bin, params);
      objeto.stderr.on('data', function (err) {
         stderr += err;
      });

      objeto.stdout.on('data', function (output) {
         stdout += output;
      });

      objeto.on('exit', function (code) {
         callback(stderr, stdout, code);
         active--;
         next();
      });

   } else {
      if (params instanceof Array && params.length <= 2) {
         console.log('Params to short for ejecucion');
         active--;
         next();
      }
   }
};

/**
 * Description:
 *    Convert a multiples resolution
 *    avoid code repetition.
 *
 * Parameters:
 * input - path/to/the/inputFile.ext as a string.
 * params - an object of ffmpeg options to be added to the predefined ones (optional).
 * output - path/to/the/outputFile.ext as a string (optional).
 * callback - function to call when ffmpeg is done, ex:
 *    function (stderr, stdout, exitCode) { ... }
 */


exports.ffmpeg = function (json, callback) {
   if(Object.keys(json).length < 3)
      return callback('Falta Paramatros')
   var crf = json.crf || '14';
   var threads = json.threads || '0';

   var params = "-i " + json.input + " -vcodec libx264 -crf " + crf +
                " -threads " + threads + " -s " + json.format + " -acodec libfdk_aac -y " + json.output +
                " -sn";
   if(json.thumbnail)
    params = params + " -s 640x360 -ss 00:00:01.00 -vframes 1 -y " + json.thumbnail;
   
   if(json.splash)
    params  = params + " -ss 00:00:01.00 -vframes 1 -y " + json.splash;

   params = params.split(" ");
   push({bin: 'ffmpeg', params: params, callback: callback});
};

/**
 * Description:
 *    Convert a video in hls
 *    avoid code repetition.
 *
 * Parameters:
 * input - path/to/the/inputFile.ext as a string.
 * time - Segment length (seconds)
 * callback - function to call when ffmpeg is done, ex:
 *    function (stderr, stdout, exitCode) { ... }
 */

exports.hls = function(json, callback){
   if(Object.keys(json).length < 2)
      return callback('Falta Paramatros')
   var params = {};

   params = helpers.objectToArray(_.assign({
         '-i': json.input,
         '-s': json.time,
         '-o': json.output
      },params));
   
   push({bin: './HLS-Stream-Creator.sh', params: params, callback: callback});
}


/*
*  The function takes a absolute file path and returns a meta data object
*  @params {String} input
*  @params {Callback} callback function(error, jsonMetaObject)
*/

exports.getMetadata = function (input, callback) {
   child_process.exec("ffprobe -loglevel error -show_format -show_streams " + input + " -print_format json", function (error, stdout, stderr) {
      try {
         stdout = JSON.parse(stdout);
         callback(error, stdout);
      } catch (e) {
         callback(error, stdout);
      }
   });
};

exports.getLimitFormats = function (input, callback) {
  this.getMetadata(input, function(error, data){
    var height = data.streams[0].coded_height

    var index = height >= 1080 ? 3 : height >= 720 ? 2 : height >= 480 ? 1 : 0

    var newFormats = formats.filter(function(format, i){
      return i <= index
    })

    callback(error, newFormats)
  })
}