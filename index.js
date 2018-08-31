/*
 * Kontra.js v4.0.1 (Custom Build on 2018-08-21) | MIT
 * Build: https://straker.github.io/kontra/download?files=gameLoop+keyboard+sprite+store
 */
kontra={init(t){var n=this.canvas=document.getElementById(t)||t||document.querySelector("canvas");this.context=n.getContext("2d")},_noop:new Function,_tick:new Function};
kontra.gameLoop=function(e){let t,n,a,r,o=(e=e||{}).fps||60,i=0,p=1e3/o,c=1/o,s=!1===e.clearCanvas?kontra._noop:function(){kontra.context.clearRect(0,0,kontra.canvas.width,kontra.canvas.height)};function d(){if(n=requestAnimationFrame(d),a=performance.now(),r=a-t,t=a,!(r>1e3)){for(kontra._tick(),i+=r;i>=p;)m.update(c),i-=p;s(),m.render()}}let m={update:e.update,render:e.render,isStopped:!0,start(){t=performance.now(),this.isStopped=!1,requestAnimationFrame(d)},stop(){this.isStopped=!0,cancelAnimationFrame(n)}};return m};
!function(){let n={},t={},e={13:"enter",27:"esc",32:"space",37:"left",38:"up",39:"right",40:"down"};for(let n=0;n<26;n++)e[65+n]=(10+n).toString(36);for(i=0;i<10;i++)e[48+i]=""+i;addEventListener("keydown",function(i){let c=e[i.which];t[c]=!0,n[c]&&n[c](i)}),addEventListener("keyup",function(n){t[e[n.which]]=!1}),addEventListener("blur",function(n){t={}}),kontra.keys={bind(t,e){[].concat(t).map(function(t){n[t]=e})},unbind(t,e){[].concat(t).map(function(t){n[t]=e})},pressed:n=>!!t[n]}}();
!function(){class t{constructor(t,i){this._x=t||0,this._y=i||0}add(t,i){this.x+=(t.x||0)*(i||1),this.y+=(t.y||0)*(i||1)}clamp(t,i,h,s){this._c=!0,this._a=t,this._b=i,this._d=h,this._e=s}get x(){return this._x}get y(){return this._y}set x(t){this._x=this._c?Math.min(Math.max(this._a,t),this._d):t}set y(t){this._y=this._c?Math.min(Math.max(this._b,t),this._e):t}}kontra.vector=((i,h)=>new t(i,h)),kontra.vector.prototype=t.prototype;class i{init(t,i,h,s){for(i in t=t||{},this.position=kontra.vector(t.x,t.y),this.velocity=kontra.vector(t.dx,t.dy),this.acceleration=kontra.vector(t.ddx,t.ddy),this.width=this.height=0,this.context=kontra.context,t)this[i]=t[i];if(h=t.image)this.image=h,this.width=h.width,this.height=h.height;else if(h=t.animations){for(i in h)this.animations[i]=h[i].clone(),s=s||h[i];this._ca=s,this.width=s.width,this.height=s.height}return this}get x(){return this.position.x}get y(){return this.position.y}get dx(){return this.velocity.x}get dy(){return this.velocity.y}get ddx(){return this.acceleration.x}get ddy(){return this.acceleration.y}set x(t){this.position.x=t}set y(t){this.position.y=t}set dx(t){this.velocity.x=t}set dy(t){this.velocity.y=t}set ddx(t){this.acceleration.x=t}set ddy(t){this.acceleration.y=t}isAlive(){return this.ttl>0}collidesWith(t){return this.x<t.x+t.width&&this.x+this.width>t.x&&this.y<t.y+t.height&&this.y+this.height>t.y}update(t){this.advance(t)}render(){this.draw()}playAnimation(t){this._ca=this.animations[t],this._ca.loop||this._ca.reset()}advance(t){this.velocity.add(this.acceleration,t),this.position.add(this.velocity,t),this.ttl--,this._ca&&this._ca.update(t)}draw(){this.image?this.context.drawImage(this.image,this.x,this.y):this._ca?this._ca.render(this):(this.context.fillStyle=this.color,this.context.fillRect(this.x,this.y,this.width,this.height))}}kontra.sprite=(t=>(new i).init(t)),kontra.sprite.prototype=i.prototype}();
kontra.store={set(t,e){void 0===e?localStorage.removeItem(t):localStorage.setItem(t,JSON.stringify(e))},get(t){let e=localStorage.getItem(t);try{e=JSON.parse(e)}catch(t){}return e}};
let mergedPeaks;
let splitPeaks;

/**
 * Wave code taken from wavesurfer.js
 * @see https://github.com/katspaugh/wavesurfer.js
 */
function exportPCM(length, accuracy, noWindow, start) {
  length = length || 1024;
  start = start || 0;
  accuracy = accuracy || 10000;
  const peaks = getPeaks(length, start);

  // find largest peak and treat it as peaks of 1 and normalize rest of peaks
  let maxPeak = 0;
  let arr = [].map.call(peaks, peak => {
    if (peak > maxPeak) {
      maxPeak = peak;
    }
    return peak;
  });
  let normalizePeak = 1 - maxPeak;
  arr = arr.map(peak =>  Math.round((peak + normalizePeak) * accuracy) / accuracy);

  return arr;
}

function setLength(length) {
  splitPeaks = [];
  mergedPeaks = [];
  // Set the last element of the sparse array so the peak arrays are
  // appropriately sized for other calculations.
  const channels = buffer ? buffer.numberOfChannels : 1;
  let c;
  for (c = 0; c < channels; c++) {
    splitPeaks[c] = [];
    splitPeaks[c][2 * (length - 1)] = 0;
    splitPeaks[c][2 * (length - 1) + 1] = 0;
  }
  mergedPeaks[2 * (length - 1)] = 0;
  mergedPeaks[2 * (length - 1) + 1] = 0;
}

function getPeaks(length, first, last) {
  first = first || 0;
  last = last || length - 1;

  setLength(length);

  /**
   * The following snippet fixes a buffering data issue on the Safari
   * browser which returned undefined It creates the missing buffer based
   * on 1 channel, 4096 samples and the sampleRate from the current
   * webaudio context 4096 samples seemed to be the best fit for rendering
   * will review this code once a stable version of Safari TP is out
   */
  // if (!buffer.length) {
  //     const newBuffer = this.createBuffer(1, 4096, this.sampleRate);
  //     buffer = newBuffer.buffer;
  // }

  const sampleSize = buffer.length / length;
  const sampleStep = ~~(sampleSize / 10) || 1;
  const channels = buffer.numberOfChannels;
  let c;

  for (c = 0; c < channels; c++) {
      const peaks = splitPeaks[c];
      const chan = buffer.getChannelData(c);
      let i;

      for (i = first; i <= last; i++) {
          const start = ~~(i * sampleSize);
          const end = ~~(start + sampleSize);
          let min = 0;
          let max = 0;
          let j;

          for (j = start; j < end; j += sampleStep) {
              const value = chan[j];

              if (value > max) {
                  max = value;
              }

              if (value < min) {
                  min = value;
              }
          }

          peaks[2 * i] = max;
          peaks[2 * i + 1] = min;

          if (c == 0 || max > mergedPeaks[2 * i]) {
              mergedPeaks[2 * i] = max;
          }

          if (c == 0 || min < mergedPeaks[2 * i + 1]) {
              mergedPeaks[2 * i + 1] = min;
          }
      }
  }

  return mergedPeaks;
}
kontra.init();

//------------------------------------------------------------
// Global variables
//------------------------------------------------------------
const ctx = kontra.context;
const mid = kontra.canvas.height / 2;  // midpoint of the canvas
const waveWidth = 2;
const waveHeight = 215;
const maxLength = kontra.canvas.width / waveWidth + 3 | 0; // maximum number of peaks to show on screen
const defaultOptions = {
  music: 1,
  uiScale: 1,
  gameSpeed: 1
};

let audio;  // audio file for playing/pausing
let peaks;  // peak data of the audio file
let waveData;  // array of wave audio objects based on peak data
let startBuffer;  // duplicated wave data added to the front of waveData to let the game start in the middle of the screen
let loop;  // game loop
let songName = 'SuperHero.mp3';  // name of the song
let bestTimes;  // object of best times for all songs
let bestTime;  // best time for a single song
let activeScenes = [];  // currently active scenes
let focusedBtn;  // currently focused button
let options = Object.assign(  // options for the game
  {},
  defaultOptions,
  JSON.parse(localStorage.getItem('js13k-2018:options'))
);
let fontMeasurement;  // size of text letter
let gamepad;  // gamepad state
let lastUsedInput;  // keep track of last used input device
let objectUrl;  // in-memory url of audio files
let fadeTime = 450;  // how long a scene takes to fade





//------------------------------------------------------------
// Helper functions
//------------------------------------------------------------
function clamp(value, min, max) {
  return Math.min( Math.max(min, value), max);
}





//------------------------------------------------------------
// Main functions
//------------------------------------------------------------
uploadFile.addEventListener('change', uploadAudio);

/**
 * Upload an audio file from the users computer.
 * @param {Event} e - File change event
 */
async function uploadAudio(e) {
  // show(loader);
  // hide(introText, winText, startBtn, customUpload, restartBtn);

  // clear any previous uploaded song
  URL.revokeObjectURL(objectUrl);

  let file = e.currentTarget.files[0];
  objectUrl = URL.createObjectURL(file);

  await generateWaveData(objectUrl);
  songName = uploadFile.value.replace(/^.*fakepath/, '').substr(1);
  // songTitle.textContent = 'Playing: ' + songName;
  console.log('done uploading');
  getBestTime();

  // hide(loader);
  // show(songTitle, startBtn);
}

/**
 * Start the game.
 */
function start() {

  // safari still retains focus on buttons even after they are hidden and
  // pressing space activates the hidden button. need to manually remove focus
  // from the buttons to prevent this
  // startBtn.blur();
  // restartBtn.blur();
  focusedBtn && focusedBtn.blur();

  startMove = -kontra.canvas.width / 2 | 0;
  startCount = 0;
  audio.currentTime = 0;
  audio.volume = options.music;
  audio.playbackRate = options.gameSpeed;
  ship.points = [];
  ship.y = mid;
  // Array.from(document.querySelectorAll('.ui > *')).forEach(el => hide(el));

  showTutorialBars = true;
  isTutorial = true;
  tutorialScene.show();
}

// /**
//  * Show game over screen.
//  */
function gameOver() {
  audio.pause();
  setBestTime();

  // give player enough time to recover from controlling the ship before they can
  // click the restart button with the spacebar
  gameOverScene.show(() => restartBtn.focus());
}

// /**
//  * Show win screen.
//  */
// function win() {
//   loop.stop();
//   setBestTime();
//   show(winText, customUpload);
// }

// /**
//  * Show intro screen.
//  */
// function intro() {
//   // buttonLoop.start();
//   startBtn.show();
//   uploadBtn.show();
//   optionBtn.show();
// }

// function loading() {

// }

async function main() {
  setFontMeasurement();

  // music from https://opengameart.org/content/adventure-theme
  await generateWaveData('./' + songName);
  getBestTime();
  menuScene.show(() => startBtn.focus());
}
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
//------------------------------------------------------------
// Drawing functions
//------------------------------------------------------------

/**
 * Draw a neon rectangle in the given color.
 * @see https://codepen.io/agar3s/pen/pJpoya?editors=0010#0
 * Don't use shadow blur as it is terrible for performance
 * @see https://stackoverflow.com/questions/15706856/how-to-improve-performance-when-context-shadow-canvas-html5-javascript
 *
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
  ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + ",0.2)";
  ctx.lineWidth = 10.5;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 8;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 5.5;
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
  ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + ",0.2)";

  ctx.lineWidth = 10.5;
  drawLines(points, move);

  ctx.lineWidth = 8;
  drawLines(points, move);

  ctx.lineWidth = 5.5;
  drawLines(points, move);

  ctx.lineWidth = 3;
  drawLines(points, move);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  drawLines(points, move);

  ctx.restore();
};

/**
 * Draw the top and bottom time bars
 */
function drawTimeUi() {
  ctx.save();
  ctx.fillStyle = '#222';

  // top bar
  ctx.beginPath();
  ctx.moveTo(0, 43 * options.uiScale);
  ctx.lineTo(80 * options.uiScale, 43 * options.uiScale);
  for (let i = 1; i <= 10 * options.uiScale | 0; i++) {
    ctx.lineTo(80 * options.uiScale +i*2, 43 * options.uiScale -i*2);
    ctx.lineTo(80 * options.uiScale +i*2+2, 43 * options.uiScale -i*2);
  }
  ctx.lineTo(170 * options.uiScale, 23 * options.uiScale);
  for (let i = 1; i <= 10 * options.uiScale | 0; i++) {
    ctx.lineTo(170 * options.uiScale +i*2, 23 * options.uiScale -i*2);
    ctx.lineTo(170 * options.uiScale +i*2+2, 23 * options.uiScale -i*2);
  }
  ctx.lineTo(192 * options.uiScale, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  // bottom bar
  ctx.beginPath();
  let y = kontra.canvas.height - 25 * options.uiScale;
  ctx.moveTo(0, y);
  ctx.lineTo(125 * options.uiScale, y);
  for (let i = 1; i <= 10 * options.uiScale | 0; i++) {
    ctx.lineTo(125 * options.uiScale +i*2, y+i*2);
    ctx.lineTo(125 * options.uiScale +i*2+2, y+i*2);
  }
  ctx.lineTo(147 * options.uiScale, kontra.canvas.height);
  ctx.lineTo(0, kontra.canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fdfdfd';
  let time = getTime(audio.currentTime);

  setFont(40);
  ctx.fillText(getSeconds(time).padStart(3, ' '), 5 * options.uiScale, 35 * options.uiScale);
  setFont(18);
  ctx.fillText(':' + getMilliseconds(time).padStart(2, '0') + '\nTIME', 80 * options.uiScale, 17 * options.uiScale);
  ctx.fillText(bestTime.padStart(6, ' ') + '\nBEST', 5 * options.uiScale, kontra.canvas.height - 5 * options.uiScale);
  ctx.restore();
}

/**
 * Draw the XBOX A button.
 * @param {number} x - X position
 * @param {number} y - Y position
 */
function drawAButton(x, y) {
  ctx.save();
  ctx.fillStyle = 'green';
  ctx.beginPath();
  ctx.arc(x, y, fontMeasurement, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'black';
  setFont(27);
  ctx.fillText('A', x - fontMeasurement / 2, y + fontMeasurement / 2);
  ctx.fillStyle = 'white';
  setFont(25);
  ctx.fillText('A', x - fontMeasurement / 2, y + fontMeasurement / 2);
  ctx.restore();
}

/**
 * Show help text in bottom left corner of screen base don input.
 */
function showHelpText() {
  ctx.save();

  if (lastUsedInput === 'keyboard') {
    setFont(18);
    ctx.fillStyle = 'white';
    ctx.fillText('[Spacebar] Select', 50 - fontMeasurement, kontra.canvas.height - 50 + fontMeasurement / 2.5);
  }
  else if (lastUsedInput === 'gamepad') {
    drawAButton(x, y);
    setFont(18);
    ctx.fillStyle = 'white';
    ctx.fillText(text, 50 + fontMeasurement * 1.5, kontra.canvas.height - 50 + fontMeasurement / 2.5);
  }

  ctx.restore();
}
/**
 * Set font size.
 * @param {number} size - Size of font
 */
function setFont(size) {
  ctx.font = size * options.uiScale + "px 'Lucida Console', Monaco, monospace";
}

/**
 * Set font measurement
 */
function setFontMeasurement() {
  fontMeasurement = 15 * options.uiScale;
}
//------------------------------------------------------------
// Input Handlers
//------------------------------------------------------------
let touchPressed;
window.addEventListener('mousedown', handleOnDown);
window.addEventListener('touchstart', handleOnDown);
window.addEventListener('mouseup', handleOnUp);
window.addEventListener('touchend', handleOnUp);
window.addEventListener('blur', handleOnUp);
window.addEventListener('beforeunload', () => {
  URL.revokeObjectURL(objectUrl);
});

// remove contextmenu as holding tap on mobile opens it
window.addEventListener('contextmenu', e => {
  e.preventDefault();
  e.stopPropagation();
  return false;
});

/**
 * Detect if a button was clicked.
 */
function handleOnDown(e) {
  touchPressed = true;

  let pageX, pageY;
  if (e.type.indexOf('mouse') !== -1) {
    lastUsedInput = 'mouse';
    pageX = e.pageX;
    pageY = e.pageY;
  }
  else {
    lastUsedInput = 'touch';

    // touchstart uses touches while touchend uses changedTouches
    // @see https://stackoverflow.com/questions/17957593/how-to-capture-touchend-coordinates
    pageX = (e.touches[0] || e.changedTouches[0]).pageX;
    pageY = (e.touches[0] || e.changedTouches[0]).pageY;
  }

  let x = pageX - kontra.canvas.offsetLeft;
  let y = pageY - kontra.canvas.offsetTop;
  let el = kontra.canvas;

  while ( (el = el.offsetParent) ) {
    x -= el.offsetLeft;
    y -= el.offsetTop;
  }

  // take into account the canvas scale
  let scale = kontra.canvas.offsetHeight / kontra.canvas.height;
  x /= scale;
  y /= scale;

  // last added scene is on top
  for (let i = activeScenes.length - 1, activeScene; activeScene = activeScenes[i]; i--) {
    if (activeScene.children) {
      activeScene.children.forEach(child => {
        if (!child.disabled && child.parent.active && child.onDown && child.collidesWith({
          // center the click
          x: x - 5,
          y: y - 5,
          width: 10,
          height: 10
        })) {
          child.onDown();
          child.blur();
          return;
        }
      });
    }
  }
}

/**
 * Release button press.
 */
function handleOnUp() {
  touchPressed = false;
}

/**
 * Move the focused button up or down.
 * @param {number} inc - Direction to move the focus button (1 = down, -1 = up).
 */
function handleArrowDownUp(inc) {
  let activeScene = activeScenes[activeScenes.length - 1];
  let index = activeScene.children.indexOf(focusedBtn);

  while (true) {
    index += inc;

    // if we get to the beginning or end we're already focused on the first/last
    // element
    if (index < 0 || index > activeScene.children.length - 1) {
      return;
    }

    let child = activeScene.children[index];
    if (child && child.focus) {
      child.focus();
      break;
    }
  }
}

// select button
kontra.keys.bind('space', () => {
  lastUsedInput = 'keyboard';

  if (focusedBtn && focusedBtn.onDown) {
    focusedBtn.onDown();
    focusedBtn.blur();
  }
});

// move focus button with arrow keys
kontra.keys.bind('up', (e) => {
  lastUsedInput = 'keyboard';

  e.preventDefault();
  handleArrowDownUp(-1);
});
kontra.keys.bind('down', (e) => {
  lastUsedInput = 'keyboard';

  e.preventDefault();
  handleArrowDownUp(1);
});

/**
 * Don't active controller sticks unless it passes a threshold.
 * @see https://www.smashingmagazine.com/2015/11/gamepad-api-in-web-games/
 * @param {number} number - Thumbstick axes
 * @param {number} threshold
 */
function applyDeadzone(number, threshold){
  percentage = (Math.abs(number) - threshold) / (1 - threshold);

  if(percentage < 0) {
    percentage = 0;
  }

  return percentage * (number > 0 ? 1 : -1);
}

/**
 * Track gamepad use every frame.
 */
let aDt = 1;
let aDuration = 0;
let axesDt = 1;
let axesDuration = 0;
function updateGamepad() {
  if (!navigator.getGamepads) return;
  gamepad = navigator.getGamepads()[0];

  if (!gamepad) return;

  // A button press
  if (gamepad.buttons[0].pressed) {
    lastUsedInput = 'gamepad';
    aDuration += 1/60;
    aDt += 1/60;
  }
  else {
    aDuration = 0;
    aDt = 1;
  }

  // run the first time immediately then hold for a bit before letting the user
  // continue to press the button down
  if ((aDt > 0.30 || (aDuration > 0.3 && aDt > 0.10)) &&
      gamepad.buttons[0].pressed && focusedBtn && focusedBtn.onDown) {
    aDt = 0;
    focusedBtn.onDown()
  }

  let axes = applyDeadzone(gamepad.axes[1], 0.5);
  let upPressed = axes < 0 || gamepad.buttons[12].pressed;
  let downPressed = axes > 0 || gamepad.buttons[13].pressed

  if (upPressed || downPressed) {
    lastUsedInput = 'gamepad';
    axesDuration += 1/60;
    axesDt += 1/60;
  }
  else {
    axesDuration = 0;
    axesDt = 1;
  }

  if (axesDt > 0.30 || (axesDuration > 0.3 && axesDt > 0.10)) {
    if (upPressed) {
      axesDt = 0;
      handleArrowDownUp(-1);
    }
    else if (downPressed) {
      axesDt = 0;
      handleArrowDownUp(1);
    }
  }
}
//------------------------------------------------------------
// Game loop
//------------------------------------------------------------
loop = kontra.gameLoop({
  update() {
    updateGamepad();

    activeScenes.forEach(activeScene => activeScene.update())

    if ((tutorialScene.active || gameScene.active) && !gameOverScene.active) {
      ship.update();
    }

    if (tutorialScene.active && !isTutorial && !tutorialScene.isHidding) {
      tutorialScene.hide(() => {

        // reset ship points to line up with gameScene move (which starts at 0);
        for (let count = 0, i = ship.points.length - 1, point; point = ship.points[i]; i--) {
          point.x = 0 - tutorialMoveInc * count++;
        }
        gameScene.show();
      });
    }
  },
  render() {
    if (showTutorialBars) {
      ctx.fillStyle = '#00a3dc';
      ctx.fillRect(0, 0, kontra.canvas.width, 160);
      ctx.fillRect(0, kontra.canvas.height - 160, kontra.canvas.width, 160);
    }

    activeScenes.forEach(activeScene => activeScene.render())

    if (menuScene.active || optionsScene.active) {
      showHelpText();
    }

    if (tutorialScene.active) {
      tutorialMove += tutorialMoveInc;
      ship.render(tutorialMove);
    }
  }
});

loop.start();
//------------------------------------------------------------
// Button
//------------------------------------------------------------
let uiSpacer = 15;

/**
 * Set the dimensions of the UI element.
 * @param {object} uiEl - UI element
 */
function setDimensions(uiEl) {
  let text = typeof uiEl.text === 'function' ? uiEl.text() : uiEl.text;
  uiEl.width = text.length * fontMeasurement + fontMeasurement * 2;
  uiEl.height = fontMeasurement * 3;

  if (uiEl.center || uiEl.type === 'button') {
    uiEl.x = uiEl.orgX - uiEl.width / 2;
  }

  // set the y position based on the position of another element
  if (uiEl.prev) {
    uiEl.y = uiEl.prev.y + uiEl.prev.height * 1.5 + uiSpacer / options.uiScale;
  }
  else {
    uiEl.y = uiEl.orgY - uiEl.height / 2;
  }

  uiEl.y += uiEl.margin || 0;
}

/**
 * Button UI element.
 * @param {object} props - Properties of the button
 */
function button(props) {
  props.orgX = props.x;
  props.orgY = props.y;
  props.type = 'button';

  setDimensions(props);

  props.render = function() {
    setDimensions(this);

    ctx.save();
    setFont(25);

    ctx.fillStyle = '#222';
    if (button.disabled) {
      ctx.globalAlpha = clamp(this.parent.alpha - 0.65, 0, 1);
    }

    let args = [this.x, this.y, this.width, this.height];

    ctx.fillRect.apply(ctx, args);

    if (this.focused) {
      args.push(255, 0, 0);
      }
    else if (this.disabled) {
      args.push(100, 100, 100);
    }
    else {
      args.push(0, 163, 220);
    }

    neonRect.apply(null, args);

    ctx.fillStyle = '#fff';
    ctx.fillText(this.text, this.x + fontMeasurement, this.y + fontMeasurement * 2);
    ctx.restore();
  };
  props.focus = function() {
    if (focusedBtn && focusedBtn.blur) focusedBtn.blur();

    focusedBtn = this;
    this.focused = true;
    this.domEl.focus();
  };
  props.blur = function() {
    this.focused = false;
    focusedBtn = null;
  };

  let button = kontra.sprite(props);

  // create accessible html button for screen readers
  let el = document.createElement('button');
  el.textContent = button.label || button.text;
  el.addEventListener('focus', button.focus.bind(button));
  button.domEl = el;

  Object.defineProperty(button, 'disabled', {
    get() { return this.domEl.disabled },
    set(value) { this.domEl.disabled = value }
  });

  return button;
}





//------------------------------------------------------------
// Text
//------------------------------------------------------------
function Text(props) {
  props.orgX = props.x;
  props.orgY = props.y;

  setDimensions(props);

  props.render = function() {
    setDimensions(this);

    let text = typeof this.text === 'function' ? this.text() : this.text;
    if (this.lastText !== text) {
      this.lastText = text;
      this.domEl.textContent = text;
    }

    ctx.save();
    ctx.fillStyle = '#fff';
    setFont(25);
    ctx.fillText(text, this.x + fontMeasurement, this.y + fontMeasurement * 2);
    ctx.restore();
  };

  let text = kontra.sprite(props);

  // create accessible html text for screen readers
  let el = document.createElement('div');

  // announce changes to screen reader
  if (typeof props.text === 'function') {
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', true);
  }
  text.domEl = el;

  return text;
}
//------------------------------------------------------------
// Scene
//------------------------------------------------------------
let scenes = [];
function Scene(name) {

  // create dom element to hold scene dom elements for screen readers.
  // this lets me hide the parent element and not each child, which caused
  // lag
  let sceneEl = document.createElement('div');
  sceneEl.hidden = true;
  uiScenes.appendChild(sceneEl);

  let scene = {
    name: name,
    alpha: 0,
    active: false,
    children: [],
    inc: 0.05,
    isHidding: false,

    // create a fade in/out transitions when hiding and showing scenes
    hide(cb) {
      this.isHidding = true;
      sceneEl.hidden = true;
      this.alpha = 1;
      this.inc = -0.05;
      setTimeout(() => {
        this.isHidding = false;
        this.active = false;
        activeScenes.splice(activeScenes.indexOf(this), 1);
        cb && cb();
      }, fadeTime);
    },
    show(cb) {
      this.active = true;
      sceneEl.hidden = false;
      activeScenes.push(this);
      this.alpha = 0;
      this.inc = 0.05;
      setTimeout(() => {
        if (this.onShow) this.onShow();
        cb && cb();
      }, fadeTime)
    },
    add() {
      Array.from(arguments).forEach(child => {
        child.parent = this;
        this.children.push(child);

        if (child.domEl) {
          sceneEl.appendChild(child.domEl);
        }
      });
    },
    update() {
      this.children.forEach(child => {
        if (child.update) {
          child.update()
        }
      });
    },
    render() {
      this.alpha = clamp(this.alpha + this.inc, 0, 1);

      ctx.save();
      ctx.globalAlpha = this.alpha;

      this.children.forEach(child => child.render());

      ctx.restore();
    }
  };

  scenes.push(scene);
  return scene;
}





//------------------------------------------------------------
// Menu Scene
//------------------------------------------------------------
let menuScene = Scene('menu');
let startBtn = button({
  x: kontra.canvas.width / 2,
  y: kontra.canvas.height / 2,
  text: 'START',
  onDown() {
    audio.play();
    audio.pause();
    menuScene.hide(() => {
      start();
    });
  }
});
let uploadBtn = button({
  x: kontra.canvas.width / 2,
  prev: startBtn,
  text: 'UPLOAD',
  onDown() {
    uploadFile.click();
  }
});
let optionsBtn = button({
  x: kontra.canvas.width / 2,
  prev: uploadBtn,
  text: 'OPTIONS',
  onDown() {
    menuScene.hide(() => {
      optionsScene.show();
    });
  }
});
menuScene.add(startBtn, uploadBtn, optionsBtn);





//------------------------------------------------------------
// Options Scene
//------------------------------------------------------------
let opts = [{
  name: 'music',
  minValue: 0,
  maxValue: 1,
  inc: 0.05
},
{
  name: 'uiScale',
  minValue: 1,
  maxValue: 1.5,
  inc: 0.05
},
{
  name: 'gameSpeed',
  minValue: 0.1,
  maxValue: 2,
  inc: 0.05
}];
let beforeOptions;
let optionsScene = Scene('options');
let focusEl;
optionsScene.onShow = () => {
  beforeOptions = Object.assign({}, options);
  focusEl.domEl.focus();
};

let startY = 200;
let optionTexts = [];

opts.forEach((opt, index) => {
  let name = opt.name.replace(/([A-Z])/g, ' $1').toUpperCase();

  let optionText = Text({
    x: 50,
    y: index === 0 ? startY : null,
    prev: index > 0 ? optionTexts[index-1] : null,
    text: name
  });
  let optionValue = Text({
    x: 475,
    y: index === 0 ? startY : null,
    center: true,
    prev: index > 0 ? optionTexts[index-1] : null,
    text() {
      return (''+Math.round(options[opt.name] * 100)).padStart(3, ' ') + '%';
    }
  });

  let decBtn = button({
    x: 375,
    y: index === 0 ? startY : null,
    prev: index > 0 ? optionTexts[index-1] : null,
    text: '−',
    label: 'Decrease ' + name,
    update() {
      this.disabled = options[opt.name] === opt.minValue;
    },
    onDown() {
      changeValue(-opt.inc);
    }
  });
  if (index === 0) {
    focusEl = decBtn;
  }

  let incBtn = button({
    x: 575,
    y: index === 0 ? startY : null,
    prev: index > 0 ? optionTexts[index-1] : null,
    text: '+',
    label: 'Increase ' + name,
    update() {
      this.disabled = options[opt.name] === opt.maxValue;
    },
    onDown() {
      changeValue(opt.inc);
    }
  });

  function changeValue(inc) {
    let value = clamp(options[opt.name] + inc, opt.minValue, opt.maxValue);
    options[opt.name] = value;
    setFontMeasurement();
  }

  optionsScene.add(optionText, optionValue, decBtn, incBtn);
  optionTexts.push(optionText);
});

let saveBtn = button({
  x: kontra.canvas.width / 2,
  prev: optionTexts[optionTexts.length-1],
  margin: 45,
  text: 'SAVE',
  onDown() {
    optionsScene.hide(() => {
      menuScene.show(() => optionsBtn.domEl.focus());
    });
  }
});
let cancelBtn = button({
  x: kontra.canvas.width / 2,
  prev: saveBtn,
  text: 'CANCEL',
  onDown() {
    optionsScene.hide(() => {
      options = beforeOptions;
      setFontMeasurement();
      menuScene.show(() => optionsBtn.domEl.focus());
    });
  }
});
optionsScene.add(saveBtn, cancelBtn);





//------------------------------------------------------------
// Tutorial Scene
//------------------------------------------------------------
let isTutorial = true;
let tutorialMove = 0;
let tutorialMoveInc = 5;
let showTutorialBars = false;

let tutorialScene = Scene('tutorial');
let tutorialText = Text({
  x: kontra.canvas.width / 2,
  y: kontra.canvas.height / 2 - 200,
  center: true,
  text() {
    let text = 'Tap or Hold';

    if (lastUsedInput === 'gamepad') {
      drawAButton(this.x - fontMeasurement * 1.5, this.y + fontMeasurement * 1.5);
    }
    else if (lastUsedInput === 'keyboard' || lastUsedInput === 'mouse') {
      text = '[Spacebar] ' + text;
    }

    return text;
  }
});
tutorialScene.add(tutorialText);





//------------------------------------------------------------
// Game Scene
//------------------------------------------------------------
let startMove;
let startCount;
let gameScene = Scene('game');
gameScene.add({
  render() {
    // context.currentTime would be as long as the audio took to load, so was
    // always off. seems it's not meant for large files. better to use audio
    // element and play it right on time
    // @see https://stackoverflow.com/questions/33006650/web-audio-api-and-real-current-time-when-playing-an-audio-file

    // calculate speed of the audio wave based on the current time
    let move, startIndex = 0, ampBar, ampBarIndex;
    if (audio.currentTime) {
      move = Math.round((audio.currentTime / audio.duration) * (peaks.length * waveWidth));
      startIndex = move / waveWidth | 0;
    }
    else {
      move = startMove + tutorialMoveInc * startCount;

      if (!gameOverScene.active) {
        startCount++;

        if (move >= 0) {
          showTutorialBars = false;
          audio.play();
        }
      }
    }

    // only draw the bars on the screen
    for (let i = startIndex; i < startIndex + maxLength && waveData[i]; i++) {
      let wave = waveData[i];
      let x = wave.x - move;

      // keep track of the amp bar
      if (x > waveWidth * (maxLength / 2 - 1) && x < waveWidth * (maxLength / 2 + 1)) {
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
      if (!gameOverScene.active) {
        for (let i = ampBarIndex - 3; i < ampBarIndex + 3 && waveData[i]; i++) {
          let wave = waveData[i];

          if (ship.x < wave.x - move + wave.width &&
              ship.x + ship.width > wave.x - move) {
            let botY = kontra.canvas.height - wave.height - wave.offset;

            if ((ship.y < wave.y + wave.height - wave.offset &&
                 ship.y + ship.height > wave.y) ||
                (ship.y < botY + wave.height + wave.offset &&
                 ship.y + ship.height > botY)) {
              return gameOver();
            }
          }
        }
        if (ship.y < -50 || ship.y > kontra.canvas.height + 50) {
          return gameOver();
        }
      }
    }

    ship.render(move);

    while (ship.points.length && ship.points[0].x - move < 0 - ship.width) {
      ship.points.shift();
    }

    drawTimeUi();

    if (waveData[waveData.length - 1].x - move <= kontra.canvas.width / 2) {
      win();
    }
  }
});





//------------------------------------------------------------
// Game Over Scene
//------------------------------------------------------------
let gameOverScene = Scene('gameOver');
let gameOverText = Text({
  x: kontra.canvas.width / 2,
  y: kontra.canvas.height / 2,
  center: true,
  text: 'GAME OVER'
});
let restartBtn = button({
  x: kontra.canvas.width / 2,
  prev: gameOverText,
  text: 'RESTART',
  onDown() {
    showTutorialBars = true;
    gameOverScene.hide();
    gameScene.hide(() => start());
  }
});

gameOverScene.add(gameOverText, restartBtn);
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
    if (kontra.keys.pressed('space') || touchPressed || (gamepad && gamepad.buttons[0].pressed)) {
      this.ddy = -this.gravity;

      isTutorial = false;
    }
    else {
      this.ddy = this.gravity;
    }

    if (isTutorial) return;

    this.y += this.dy;
    this.dy += this.ddy;

    let maxAcc = this.maxAcc / (1 / audio.playbackRate);
    if (Math.sqrt(this.dy * this.dy) > maxAcc) {
      this.dy = this.dy < 0 ? -maxAcc : maxAcc;
    }

  },
  render(move) {
    if (!gameOverScene.active) {
      this.points.push({x: this.x + move, y: this.y});
    }

    neonRect(this.x, this.y, this.width, this.height, 0, 163, 220);
    neonLine(this.points, move, 0, 163, 220);
  }
});
//------------------------------------------------------------
// Time functions
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
  if (time.indexOf(':') !== -1) {
    return time.substr(0, time.indexOf(':'));
  }

  return '0';
}

/**
 * Get milliseconds from time.
 * @param {string} time
 * @returns {string}
 */
function getMilliseconds(time) {
  if (time.indexOf(':') !== -1) {
    return time.substr(time.indexOf(':') + 1);
  }

  return '0';
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
main();