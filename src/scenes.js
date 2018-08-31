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