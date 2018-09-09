async function main() {
  setFontMeasurement();

  // var songGen = new sonantx.MusicGenerator(song);
  // songGen.createAudio(function(audio) {
  //   audio.play();
  // });

  // music from https://opengameart.org/content/adventure-theme
  await generateWaveData('./' + songName);
  getBestTime();
  menuScene.show(() => startBtn.focus());
}

main();