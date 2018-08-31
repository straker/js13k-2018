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