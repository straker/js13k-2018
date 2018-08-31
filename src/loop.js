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