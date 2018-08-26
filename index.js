// (function() {
kontra.init();
kontra.canvas.focus();

//------------------------------------------------------------
// Global variables
//------------------------------------------------------------
const ctx = kontra.context;
const mid = kontra.canvas.height / 2;  // midpoint of the canvas

const osCanvas = document.createElement('canvas');  // used to save the main context state
const osCtx = osCanvas.getContext('2d');
osCanvas.width = kontra.canvas.width;
osCanvas.height = kontra.canvas.height;

const waveWidth = 2;
const waveHeight = 215;
const maxLength = kontra.canvas.width / waveWidth + 3 | 0; // maximum number of peaks to show on screen
const defaultOptions = {
  music: 1,
  uiScale: 1,
  gameSpeed: 1,
  intensity: 1,
};

let audio;  // audio file for playing/pausing
let peaks;  // peak data of the audio file
let waveData;  // array of wave audio objects based on peak data
let startBuffer;  // duplicated wave data added to the front of waveData to let the game start in the middle of the screen
let loop;  // game loop
let songName = 'SuperHero.mp3';  // name of the song
let bestTimes;  // object of best times for all songs
let bestTime;  // best time for song
let activeScene = {};  // currently active scene
let focusedBtn;  // currently focused button
let options = Object.assign(  // options for the game
  {},
  defaultOptions,
  JSON.parse(localStorage.getItem('js13k-2018:options'))
);
let fontMeasurement;  // size of text based
setFontMeasurement();





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
// Event Handlers
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

/**
 * Detect if a button was clicked.
 */
function handleOnDown(e) {
  touchPressed = true;

  let pageX, pageY;
  if (e.type.indexOf('mouse') !== -1) {
    pageX = e.pageX;
    pageY = e.pageY;
  }
  else {
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

  activeScene.children.forEach(child => {
    if (!child.disabled && child.onDown && child.collidesWith({
      // center the click
      x: x - 5,
      y: y - 5,
      width: 10,
      height: 10
    })) {
      child.onDown();
    }
  });
}

/**
 * Release button press.
 */
function handleOnUp() {
  touchPressed = false;
}

function handleArrowDownUp(inc) {
  let index = activeScene.children.indexOf(focusedBtn);

  while (true) {
    index += inc;

    if (index < 0) {
      index = activeScene.children.length - 1;
    }
    else if (index > activeScene.children.length - 1) {
      index = 0;
    }

    let child = activeScene.children[index];

    if (child && child.focus) {
      child.focus();
      break;
    }
  }

}

kontra.keys.bind('space', () => {
  if (focusedBtn && focusedBtn.onDown) focusedBtn.onDown();
});

kontra.keys.bind('up', (e) => {
  e.preventDefault();
  handleArrowDownUp(-1);
});

kontra.keys.bind('down', (e) => {
  e.preventDefault();
  handleArrowDownUp(1);
});





//------------------------------------------------------------
// Helper functions
//------------------------------------------------------------
function clamp(value, min, max) {
  return Math.min( Math.max(min, value), max);
}

function setFontMeasurement() {
  fontMeasurement = 15 * options.uiScale;
}



//------------------------------------------------------------
// UI functions
//------------------------------------------------------------
let objectUrl;
let fadeTime = 450;

// startBtn.addEventListener('click', start);
// restartBtn.addEventListener('click', start);
// uploadBtn.addEventListener('click', () => uploadFile.click());
uploadFile.addEventListener('change', uploadAudio);
// playBtn.addEventListener('click', main);

function announce(text) {
  srlive.textContent = text;
}

/**
 * Hide an element.
 * @param {HTMLElement[]} els - Element to hide
 */
// function hide() {
//   Array.from(arguments).forEach(el => el.classList.add('hidden'));
// }

/**
 * Show an element.
 * @param {HTMLElement[]} els - Element to show
 */
// function show(els) {
//   Array.from(arguments).forEach(el => el.classList.remove('hidden'));
// }

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
  menuScene.hide();
  focusedBtn.blur();

  audio.currentTime = 0;
  audio.volume = options.music;
  audio.playbackRate = options.gameSpeed;
  ship.points = [];
  ship.y = mid;
  // Array.from(document.querySelectorAll('.ui > *')).forEach(el => hide(el));

  // give player enough time to recover from pressing the button before they
  // need to press the screen again to control the ship
  setTimeout(() => {
    // buttonLoop.stop();
    loop.start();
    // audio.volume = options.music / 10;
    activeScene = {name: 'game'};
    audio.play();
  }, fadeTime);
}

// /**
//  * Show game over screen.
//  */
// function gameOver() {
//   audio.pause();
//   loop.stop();
//   setBestTime();
//   show(gameOverText);

//   setTimeout(() => {
//     show(restartBtn);
//     restartBtn.focus();
//   }, 500);
// }

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
  // music from https://opengameart.org/content/adventure-theme
  await generateWaveData('./' + songName);
  getBestTime();
  menuScene.show();
  startBtn.focus();
}





//------------------------------------------------------------
// Button
//------------------------------------------------------------
let uiSpacer = 15;
function setDimensions(uiEl) {
  let text = typeof uiEl.text === 'function' ? uiEl.text() : uiEl.text;
  uiEl.width = text.length * fontMeasurement + fontMeasurement * 2;
  uiEl.height = fontMeasurement * 3;

  if (uiEl.center || uiEl.type === 'button') {
    uiEl.x = uiEl.orgX - uiEl.width / 2;
  }

  if (uiEl.prev) {
    uiEl.y = uiEl.prev.y + uiEl.prev.height * 1.5 + uiSpacer / options.uiScale;
  }
  else {
    uiEl.y = uiEl.orgY - uiEl.height / 2;
  }

  uiEl.y += uiEl.margin || 0;
}

function button(props) {
  props.orgX = props.x;
  props.orgY = props.y;
  props.type = 'button';

  setDimensions(props);

  let button = kontra.sprite(props);
  button.render = function() {
    setDimensions(this);

    ctx.save();
    ctx.font = 25 * options.uiScale + "px 'Lucida Console', Monaco, monospace";

    ctx.fillStyle = '#222';
    if (button.disabled) {
      ctx.globalAlpha = clamp(this.parent.alpha - 0.65, 0, 1);
    }

    ctx.fillRect(this.x, this.y, this.width, this.height);

    if (this.focused) {
      neonRect(this.x, this.y, this.width, this.height, 255, 0, 0);
    }
    else {
      neonRect(this.x, this.y, this.width, this.height, 0, 163, 220);
    }

    ctx.fillStyle = '#fff';
    ctx.fillText(this.text, this.x + fontMeasurement, this.y + fontMeasurement * 2);
    ctx.restore();
  };
  button.focus = function() {
    if (focusedBtn && focusedBtn.blur) focusedBtn.blur();

    focusedBtn = this;
    this.focused = true;
    announce((this.label || this.text) + ' button' + (this.disabled ? ', disabled' : ''));
  };
  button.blur = function() {
    this.focused = false;
    focusedBtn = null;
  };

  return button;
}





//------------------------------------------------------------
// Text
//------------------------------------------------------------
function Text(props) {
  props.orgX = props.x;
  props.orgY = props.y;

  setDimensions(props);

  let text = kontra.sprite(props);
  text.render = function() {
    setDimensions(this);

    let text = typeof this.text === 'function' ? this.text() : this.text;
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 25 * options.uiScale + "px 'Lucida Console', Monaco, monospace";
    ctx.fillText(text, this.x, this.y + fontMeasurement * 2);
    ctx.restore();
  };

  return text;
}





//------------------------------------------------------------
// Scene
//------------------------------------------------------------
let scenes = [];
function Scene(name) {
  let scene = {
    name: name,
    alpha: 0,
    children: [],
    inc: 0.05,
    hide(cb) {
      this.alpha = 1;
      this.inc = -0.05;
      setTimeout(() => {
        this.children.forEach(child => child.active = false);
        cb && cb();
      }, fadeTime)
    },
    show(cb) {
      if (this.onShow) this.onShow();
      activeScene = this;
      this.alpha = 0;
      this.inc = 0.05;
      setTimeout(() => {
        this.children.forEach(child => child.active = true);
        cb && cb();
      }, fadeTime)
    },
    add() {
      Array.from(arguments).forEach(child => {
        child.parent = this;
        this.children.push(child);
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
  onDown: start
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
},
{
  name: 'intensity',
  minValue: 0.1,
  maxValue: 2,
  inc: 0.05
}];
let beforeOptions;
let optionsScene = Scene('options');
let focusEl;
optionsScene.onShow = () => {
  beforeOptions = Object.assign({}, options);
  focusEl.focus();
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
    x: 495,
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
    announce(value + '%');
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
      menuScene.show();
      optionsBtn.focus();
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
      menuScene.show();
      optionsBtn.focus();
    });
  }
});
optionsScene.add(saveBtn, cancelBtn);





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
  let height = waveHeight * options.intensity;
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
    if (kontra.keys.pressed('space') || touchPressed) {
      this.ddy = -this.gravity;
    }
    else {
      this.ddy = this.gravity;
    }

    this.y += this.dy;
    this.dy += this.ddy;

    let maxAcc = this.maxAcc / (1 / audio.playbackRate);
    if (Math.sqrt(this.dy * this.dy) > maxAcc) {
      this.dy = this.dy < 0 ? -maxAcc : maxAcc;
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
loop = kontra.gameLoop({
  update() {
    if (activeScene.render) activeScene.update();

    if (activeScene.name !== 'game') return;

    ship.update();
  },
  render() {

    if (activeScene.render) activeScene.render();

    if (activeScene.name !== 'game') return;

    // context.currentTime would be as long as the audio took to load, so was
    // always off. seems it's not meant for large files. better to use audio
    // element and play it right on time
    // @see https://stackoverflow.com/questions/33006650/web-audio-api-and-real-current-time-when-playing-an-audio-file

    // calculate speed of the audio wave based on the current time
    let move = Math.round((audio.currentTime / audio.duration) * (peaks.length * waveWidth));
    let ampBar, ampBarIndex;

    // only draw the bars on the screen
    let startIndex = move / waveWidth | 0;
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

    ctx.font = 40 * options.uiScale + "px 'Lucida Console', Monaco, monospace";
    ctx.fillText(getSeconds(time).padStart(3, ' '), 5 * options.uiScale, 35 * options.uiScale);
    ctx.font = 18 * options.uiScale + "px 'Lucida Console', Monaco, monospace";
    ctx.fillText(':' + getMilliseconds(time).padStart(2, '0') + '\nTIME', 80 * options.uiScale, 17 * options.uiScale);
    ctx.fillText(bestTime.padStart(6, ' ') + '\nBEST', 5 * options.uiScale, kontra.canvas.height - 5 * options.uiScale);
    ctx.restore();

    if (waveData[waveData.length - 1].x - move <= kontra.canvas.width / 2) {
      win();
    }
  }
});

loop.start();
main();
// })();