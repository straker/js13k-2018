//------------------------------------------------------------
// Audio functions
//------------------------------------------------------------
let context = new (window.AudioContext || window.webkitAudioContext)();
uploadFile.addEventListener('change', uploadAudio);

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
 * Upload an audio file from the users computer.
 * @param {Event} e - File change event
 */
async function uploadAudio(e) {

  // clear any previous uploaded song
  URL.revokeObjectURL(objectUrl);

  let file = e.currentTarget.files[0];
  objectUrl = URL.createObjectURL(file);

  await generateWaveData(objectUrl);
  songName = uploadFile.value.replace(/^.*fakepath/, '').substr(1);
  getBestTime();
  uploadScene.hide();
  startBtn.onDown();
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
  let numPeaks = audio.duration / 8 | 0;
  peaks = exportPCM(1024 * numPeaks);  // change this by increments of 1024 to get more peaks

  startBuffer = new Array(maxLength / 2 | 0).fill(0);

  // remove all negative peaks
  let waves = peaks
    .map((peak, index) => peak >= 0 ? peak : peaks[index-1]);

  let pos = mid;  // position of next turn
  let lastPos = 0;  // position of the last turn
  let gapDistance = maxLength;  // how long to get to the next turn
  let step = 0;  // increment of each peak to pos
  let offset = 0;  // offset the wave data position to create curves

  let minBarDistance = 270;  // min distance between top and bottom wave bars
  let heightDt = minBarDistance - waveHeight + 10;  // distance between max height and wave height
  let heightStep = heightDt / (startBuffer.length + waves.length);  // game should reach the max bar height by end of the song
  let counter = 0;
  let peakVisited = false;
  let obstacle;
  let prevObstacle;

  let yPos = 0;
  let yLastPos = 0;
  let yGapDistance = maxLength;
  let yStep = 0;
  let yOffset = 0;
  let yCounter = 0;

  let barOffset;

  waveData = startBuffer
    .concat(waves)
    .map((peak, index, waves) => {

      if (index >= startBuffer.length) {
        offset += step;
        yOffset += yStep

        // all calculations are based on the peaks data so that the path is the
        // same every time
        let peakIndex = index - startBuffer.length;
        let anchorPeak = peaks[peakIndex];

        if (++counter >= gapDistance) {
          counter = 0;
          lastPos = pos;
          pos = mid + getSign(anchorPeak) * (300 - 300 * Math.abs(anchorPeak));
          // pos = mid + (Math.random() * 600 - 300);  // generate random number between -300 and 300
          // gapDistance = 300 + (Math.random() * 200 - 100);  // generate random number between 200 and 400

          // use a new anchor peak to determine each "random", but get the new peak
          // base don the current anchor peak (somehow)
          gapDistance = 300 + getSign(anchorPeak) * (100 - 100 * Math.abs(anchorPeak));
          step = (pos - lastPos) / gapDistance;
        }

        if (++yCounter >= yGapDistance) {
          let max = (225 - heightStep * index) / 2;

          yCounter = 0;
          lastYPos = yPos;
          yGapDistance = 100;
          yPos = getRandom(-max, max);
          yStep = (yPos - lastYPos) / yGapDistance;
        }
      }

      // a song is more or less "intense" based on how much it switches between
      // high and low peaks. a song like "Through the Fire and the Flames" has
      // a high rate of switching so is more intense. need to look a few peaks
      // before to ensure we find the low peaks
      let peakThreshold = 0.38; // increase or decrease to get less or more obstacles
      let lowPeak = 1;
      for (let i = index - 5; i < index; i++) {
        if (waves[i] < lowPeak) {
          lowPeak = waves[i];
        }
      }

      // don't create obstacles when the slope of the offset is too large
      let addObstacle = index > maxLength * 3 && peak - lowPeak >= peakThreshold && step < 0.7;
      let height = addObstacle
        ? kontra.canvas.height / 2 - Math.max(65, 35 * (1 / peak))
        : 160 + peak * waveHeight + heightStep * index;

      return {
        x: index * waveWidth,
        y: 0,
        width: waveWidth,
        height: height,
        offset: offset,
        yOffset: addObstacle ? yOffset : 0
      };
    });

  return Promise.resolve();
}