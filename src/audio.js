//------------------------------------------------------------
// Audio functions
//------------------------------------------------------------
let context = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Load audio file as an ArrayBuffer.
 * @param {string} url - URL of the audio file
 * @returns {Promise} resolves with decoded audio data
 */
function loadAudioBuffer(url) {

  // we can't use fetch because response.arrayBuffer() isn't supported
  // in lots of browsers
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.responseType = 'arraybuffer';

    request.onload = function() {
      context.decodeAudioData(request.response, decodedData => {
        resolve(decodedData)
      });
    };

    request.open('GET', url, true);
    request.send();
  });
}

/**
 * Load audio file as an Audio element.
 * @param {string} url - URL of the audio file
 * @returns {Promise} resolves with audio element
 */
function loadAudio(url) {
  return new Promise((resolve, reject) => {
    let audioEl = document.createElement('audio');

    audioEl.addEventListener('canplay', function() {
      resolve(this);
    });

    audioEl.onerror = function(e) {
      console.error('e:', e);
      reject(e);
    };

    audioEl.src = url;
    audioEl.load();
  })
}

/**
 * Generate the wave data for an audio file.
 * @param {string} url - URL of the audio file
 */
async function generateWaveData(url) {
  buffer = await loadAudioBuffer(url);
  audio = await loadAudio(url);

  // numPeaks determines the speed of the game, the less peaks per duration, the
  // slower the game plays
  let height = waveHeight;
  let numPeaks = audio.duration / 8 | 0;
  peaks = exportPCM(1024 * numPeaks);  // change this by increments of 1024 to get more peaks

  startBuffer = new Array(maxLength / 2 | 0).fill(0);

  let waves = peaks
    .map((peak, index) => peak >= 0 ? peak : peaks[index-1]);

  let pos = mid;  // position of next turn
  let lastPos = 0;  // position of the last turn
  let gapDistance = maxLength;  // how long to get to the next turn
  let step = 0;  // increment of each peak to pos
  let offset = 0;  // offset the wave data position to create curves
  let minBarDistance = 270;  // min distance between top and bottom wave bars

  let heightDt = minBarDistance - height + 10;  // distance between max height and wave height
  let heightStep = heightDt / (startBuffer.length + waves.length);  // game should reach the max bar height by end of the song

  let counter = 0;

  waveData = startBuffer
    .concat(waves)
    .map((peak, index) => {
      offset += step;

      if (++counter >= gapDistance) {
        counter = 0;
        lastPos = pos;
        pos = mid + (Math.random() * 600 - 300);  // generate random number between -300 and 300
        gapDistance = 300 + (Math.random() * 200 - 100);  // generate random number between 200 and 400
        step = (pos - lastPos) / gapDistance;
      }


      return {
        x: index * waveWidth,
        y: 0,
        width: waveWidth,
        height: 160 + peak * height + heightStep * index,
        offset: offset
      }
    });

  return Promise.resolve();
}