kontra.init();

//------------------------------------------------------------
// Global variables
//------------------------------------------------------------
const ctx = kontra.context;
const mid = kontra.canvas.height / 2;  // midpoint of the canvas

const waveWidth = 2;
const waveHeight = kontra.canvas.height / 3;
const maxLength = kontra.canvas.width / waveWidth + 3 | 0; // maximum number of peaks to show on screen

let audio;  // audio file for playing/pausing
let peaks;  // peak data of the audio file
let waveData;  // array of wave audio objects based on peak data
let startBuffer;  // duplicated wave data added to the front of waveData to let the game start in the middle of the screen
let loop;  // game loop
let songName = 'superhero.ogg';  // name of the song
let bestTimes;  // object of best times for all songs
let bestTime;  // best time for song




//------------------------------------------------------------
// Utility functions
//------------------------------------------------------------

/**
 * Get the time in ss:ms format.
 * @param {number} time
 * @returns {string}
 */
function getTime(time) {
  return ('' + ((time * 100 | 0) / 100)).replace('.', ':');
}

/**
 * Get seconds from time.
 * @param {string} time
 * @returns {string}
 */
function getSeconds(time) {
  return time.substr(0, time.indexOf(':'));
}

/**
 * Get milliseconds from time.
 * @param {string} time
 * @returns {string}
 */
function getMilliseconds(time) {
  return time.substr(time.indexOf(':') + 1);
}

/**
 * Get the best time for the song.
 */
function getBestTime() {
  bestTimes = kontra.store.get('js13k-2018:best') || {};
  bestTime = bestTimes[songName] || '0:00';
}

/**
 * Set the best time for the song.
 */
function setBestTime() {
  if (isBetterTime(audio.currentTime)) {
    bestTime = getTime(audio.currentTime);
    bestTimes[songName] = bestTime;
    kontra.store.set('js13k-2018:best', bestTimes);
  }
}

/**
 * Check to see if the time is better than the best time.
 * @param {number} time
 * @returns {boolean}
 */
function isBetterTime(time) {
  return time > parseInt(bestTime.replace(':', '.'));
}





//------------------------------------------------------------
// Drawing functions
//------------------------------------------------------------

/**
 * Draw a neon rectangle in the given color.
 * @see https://codepen.io/agar3s/pen/pJpoya?editors=0010#0
 * @param {number} x - X position of the rectangle
 * @param {number} y - Y position of the rectangle
 * @param {number} w - Width of the rectangle
 * @param {number} h - Height of the rectangle
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 */
function neonRect(x, y, w, h, r, g, b) {
  ctx.save();
  ctx.shadowColor = "rgb(" + r + "," + g + "," + b + ")";
  ctx.shadowBlur = 10;
  ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + ",0.2)";
  ctx.lineWidth = 7.5;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 6;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 4.5;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
};

/**
 * Line to each point.
 * @param {object[]} points - Object of x, y positions
 * @param {number} move - distance to move each point by
 */
function drawLines(points, move) {
  ctx.beginPath();
  ctx.moveTo(points[0].x - move, points[0].y);
  points.forEach(point => {
    ctx.lineTo(point.x - move, point.y);
  });
  ctx.stroke();
}

/**
 * Draw a neon line between points in the given color.
 * @param {object[]} points - Object of x, y positions
 * @param {number} move - Distance to move each point by
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 */
function neonLine(points, move, r, g, b) {
  if (!points.length) return;

  ctx.save();
  ctx.shadowColor = "rgb(" + r + "," + g + "," + b + ")";
  ctx.shadowBlur = 10;
  ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + ",0.2)";

  ctx.lineWidth = 7.5;
  drawLines(points, move);

  ctx.lineWidth = 6;
  drawLines(points, move);

  ctx.lineWidth = 4.5;
  drawLines(points, move);

  ctx.lineWidth = 3;
  drawLines(points, move);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  drawLines(points, move);

  ctx.restore();
};





//------------------------------------------------------------
// UI functions
//------------------------------------------------------------
let objectUrl;

startBtn.addEventListener('click', start);
restartBtn.addEventListener('click', start);

uploadBtn.addEventListener('click', () => uploadFile.click());
uploadFile.addEventListener('change', uploadAudio);

async function uploadAudio(e) {
  show(loader);
  hide(introText);
  hide(winText);
  hide(startBtn);
  hide(customUpload);
  hide(restartBtn);

  let file = e.currentTarget.files[0];
  objectUrl = URL.createObjectURL(file);

  await generateWaveData(objectUrl);
  URL.revokeObjectURL(objectUrl);
  songName = uploadFile.value.replace(/^.*fakepath/, '').substr(1);
  songTitle.textContent = 'Playing: ' + songName;
  getBestTime();

  hide(loader);
  show(songTitle);
  show(startBtn);
}

/**
 * Hide an element.
 * @param {HTMLElement} el - Element to hide
 */
function hide(el) {
  el.hidden = true;
}

/**
 * Show an element.
 * @param {HTMLElement} el - Element to show
 */
function show(el) {
  el.hidden = false;
}

/**
 * Start the game.
 */
function start() {
  audio.currentTime = 0;
  firstTime = 0;
  ship.points = [];
  ship.y = mid;
  Array.from(document.querySelectorAll('.ui > *')).forEach(hide);
  setTimeout(() => loop.start(), 10);
}

/**
 * Show game over screen.
 */
function gameOver() {
  audio.pause();
  loop.stop();
  setBestTime();
  show(restartBtn);
  show(customUpload);
  restartBtn.focus();
}

/**
 * Show win screen.
 */
function win() {
  loop.pause();
  setBestTime();
  show(winText);
  show(customUpload);
}

/**
 * Show intro screen.
 */
function intro() {
  hide(loader);
  show(introText);
  show(startBtn);
  show(customUpload);
  startBtn.focus();
}





//------------------------------------------------------------
// Audio functions
//------------------------------------------------------------
window.AudioContext = window.AudioContext || window.webkitAudioContext;
let context = new AudioContext();

/**
 * Load audio file as an ArrayBuffer.
 * @param {string} url - URL of the audio file
 * @returns {Promise} resolves with decoded audio data
 */
function loadAudioBuffer(url) {
  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(buffer => {
      return context.decodeAudioData(buffer, decodedData => {
        return Promise.resolve(decodedData)
      })
    });
}

/**
 * Load audio file as an Audio element.
 * @param {string} url - URL of the audio file
 * @returns {Promise} resolves with audio element
 */
function loadAudio(url) {
  return new Promise(resolve => {
    let audioEl = document.createElement('audio');

    audioEl.addEventListener('canplay', function() {
      resolve(this);
    });

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

  peaks = exportPCM(1024*8);  // change this by increments of 1024 to get more peaks
  startBuffer = peaks
    .slice(0, maxLength / 2 | 0)
    .map((peak, index) => peak >= 0 ? peak : peaks[index-1]);  // remove negative peaks

  let waves = peaks
    .map((peak, index) => peak >= 0 ? peak : peaks[index-1]);

  let pos = mid;  // position of next turn
  let lastPos = 0;  // position of the last turn
  let gapDistance = maxLength;  // how long to get to the next turn
  let step = 0;  // increment of each peak to pos
  let offset = 0;  // offset the wave data position to create curves
  let minBarDistance = mid - 50;  // min distance between top and bottom wave bars

  let heightDt = minBarDistance - waveHeight + 10;  // distance between max height and wave height
  let heightStep = heightDt / (startBuffer.length + waves.length);  // game should reach the max bar height by end of the song

  let counter = 0;

  waveData = startBuffer
    .concat(waves)
    .map((peak, index) => {
      offset += step;

      if (++counter >= gapDistance) {
        counter = 0;
        lastPos = pos;
        pos = mid + (Math.random() * kontra.canvas.height - mid);  // generate random number between -300 and 300
        gapDistance = 300 + (Math.random() * 200 - 100);  // generate random number between 200 and 400
        step = (pos - lastPos) / gapDistance;
      }


      return {
        x: index * waveWidth,
        y: 0,
        width: waveWidth,
        height: 10 + peak * waveHeight + heightStep * index,
        offset: offset
      }
    });

  return Promise.resolve();
}





//------------------------------------------------------------
// Ship
//------------------------------------------------------------
let ship = kontra.sprite({
  x: kontra.canvas.width / 2 - waveWidth / 2,
  y: kontra.canvas.height / 2 - waveWidth / 2,
  width: waveWidth,
  height: waveWidth,
  gravity: 5,
  points: [],
  maxAcc: 8,
  update() {
    if (kontra.keys.pressed('space')) {
      this.ddy = -this.gravity;
    }
    else {
      this.ddy = this.gravity;
    }

    this.y += this.dy;
    this.dy += this.ddy;

    if (Math.sqrt(this.dy * this.dy) > this.maxAcc) {
      this.dy = this.dy < 0 ? -this.maxAcc : this.maxAcc;
    }

  },
  render(move) {
    this.points.push({x: this.x + move, y: this.y});
    neonRect(this.x, this.y, this.width, this.height, 0, 163, 220);
    neonLine(this.points, move, 0, 163, 220);
  }
});





//------------------------------------------------------------
// Game loop
//------------------------------------------------------------
let firstTime = false;
loop = kontra.gameLoop({
  update() {
    ship.update();
  },
  render() {

    // context.currentTime would be as long as the audio took to load, so was
    // always off. seems it's not meant for large files. better to use audio
    // element and play it right on time
    // @see https://stackoverflow.com/questions/33006650/web-audio-api-and-real-current-time-when-playing-an-audio-file
    if (!firstTime) {
      audio.play();
      firstTime = true;
    }

    // calculate speed of the audio wave based on the current time
    let move = Math.round((audio.currentTime / audio.duration) * (peaks.length * waveWidth));
    let ampBar, ampBarIndex;

    // only draw the bars on the screen
    let startIndex = move / waveWidth | 0;
    for (let i = startIndex; i < startIndex + maxLength && waveData[i]; i++) {
      let wave = waveData[i];
      let x = wave.x - move;

      // keep track of the amp bar
      if (x > waveWidth * (startBuffer.length - 1) && x < waveWidth * (startBuffer.length + 1)) {
        ampBar = wave;
        ampBarIndex = i;
      }
      else {
        ctx.fillStyle = '#00a3dc';
        ctx.fillRect(x, wave.y, wave.width, wave.height - wave.offset);  // top bar
        ctx.fillRect(x, kontra.canvas.height - wave.height - wave.offset, wave.width, wave.height + wave.offset);  // bottom bar
      }
    }

    // draw amp bar
    if (ampBar) {
      neonRect((ampBar.x - move) - waveWidth, ampBar.y, ampBar.width + waveWidth * 2, ampBar.height - ampBar.offset, 255, 0, 0);
      neonRect((ampBar.x - move) - waveWidth, kontra.canvas.height - ampBar.y, ampBar.width + waveWidth * 2, -ampBar.height - ampBar.offset, 255, 0, 0);

      // collision detection
      for (let i = ampBarIndex - 3; i < ampBarIndex + 3 && waveData[i]; i++) {
        let wave = waveData[i];

        if (ship.x < wave.x - move + wave.width &&
            ship.x + ship.width > wave.x - move) {
          let botY = kontra.canvas.height - wave.height - wave.offset;

          if ((ship.y < wave.y + wave.height - wave.offset &&
               ship.y + ship.height > wave.y) ||
              (ship.y < botY + wave.height + wave.offset &&
               ship.y + ship.height > botY)) {
            // gameOver();
          }
        }
      }
      if (ship.y < -50 || ship.y > kontra.canvas.height + 50) {
        // gameOver();
      }
    }

    ship.render(move);

    while (ship.points.length && ship.points[0].x - move < 0 - ship.width) {
      ship.points.shift();
    }

    // time
    ctx.fillStyle = '#222';

    // top bar
    ctx.beginPath();
    ctx.moveTo(0, 43);
    ctx.lineTo(80, 43);
    for (let i = 1; i <= 10; i++) {
      ctx.lineTo(80+i*2, 43-i*2);
      ctx.lineTo(80+i*2+2, 43-i*2);
    }
    ctx.lineTo(170, 23);
    for (let i = 1; i <= 10; i++) {
      ctx.lineTo(170+i*2, 23-i*2);
      ctx.lineTo(170+i*2+2, 23-i*2);
    }
    ctx.lineTo(192, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // bottom bar
    ctx.beginPath();
    let y = kontra.canvas.height - 25;
    ctx.moveTo(0, y);
    ctx.lineTo(125, y);
    for (let i = 1; i <= 10; i++) {
      ctx.lineTo(125+i*2, y+i*2);
      ctx.lineTo(125+i*2+2, y+i*2);
    }
    ctx.lineTo(147, kontra.canvas.height);
    ctx.lineTo(0, kontra.canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fdfdfd';
    let time = getTime(audio.currentTime);

    ctx.font = "40px 'Lucida Console', Monaco, monospace";
    ctx.fillText(getSeconds(time).padStart(3, ' '), 5, 35);
    ctx.font = "18px 'Lucida Console', Monaco, monospace";
    ctx.fillText(':' + getMilliseconds(time).padStart(2, '0') + '\nTime', 80, 17);
    ctx.fillText(bestTime.padStart(6, ' ') + '\nBest', 5, kontra.canvas.height - 5);

    if (waveData[waveData.length - 1].x - move <= kontra.canvas.width / 2) {
      win();
    }
  }
});





//------------------------------------------------------------
// Main
//------------------------------------------------------------
async function main() {

  // music from https://opengameart.org/content/adventure-theme
  await generateWaveData('./SuperHero_original.ogg');
  getBestTime();
  intro();
}
main();