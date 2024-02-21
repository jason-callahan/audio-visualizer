"use strict";

import snapone_logo from "./snapone_logo.js";
import visualizer from "./visualizer.js";

(function main() {
  const goldenRatio = 0.618;
  const logo = snapone_logo;

  const canvas = document.getElementById("visualizer");
  const context = canvas.getContext("2d");

  const offScreenCanvas = document.createElement("canvas");
  const offScreenContext = offScreenCanvas.getContext("2d");

  const logoCanvas = document.createElement("canvas");
  const logoContext = logoCanvas.getContext("2d");

  const playButton = document.getElementById("playButton");

  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
  let windowScaleWidth = windowWidth / 1920;
  let windowScaleHeight = windowHeight / 1080;

  logoCanvas.width = logo.width;
  logoCanvas.height = logo.height;

  let calcLogoWidth = logo.width * goldenRatio * windowScaleWidth;
  let calcLogoHeight = logo.height * goldenRatio * windowScaleWidth;

  let logoScaleWidth = 1;
  let logoScaleHeight = 1;
  let velocity = 0;
  let logoOpacity = 1;

  const handleResize = () => {
    console.log(" -- handleResize -- ");
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    windowScaleWidth = windowWidth / 1920;
    windowScaleHeight = windowHeight / 1080;

    visualizer.canvasWidth = offScreenCanvas.width = canvas.width = windowWidth;
    visualizer.canvasHeight =
      offScreenCanvas.height =
      canvas.height =
        windowHeight;

    logoCanvas.width = logo.width;
    logoCanvas.height = logo.height;

    visualizer.barHeightMultiplier = windowScaleHeight * 2;

    calcLogoWidth = logo.width * goldenRatio * windowScaleWidth;
    calcLogoHeight = logo.height * goldenRatio * windowScaleWidth;
    logoScaleWidth = calcLogoWidth / logo.width;
    logoScaleHeight = calcLogoHeight / logo.height;
    logoContext.scale(logoScaleWidth, logoScaleHeight);

    logo.x = windowWidth / 2 - calcLogoWidth / 2;
    logo.y = windowHeight / 2 - calcLogoHeight / 2;
  };

  let avgFrameTime = 0;
  const drawFramerate = (ctx, fps, frameCount, totalFrameTime) => {
    if (frameCount >= 10) {
      avgFrameTime = totalFrameTime / frameCount;
      fps = Math.round(1000 / avgFrameTime);
      frameCount = 0;
      totalFrameTime = 0;
    }

    ctx.font = "10px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(fps, 5, 10);
  };

  const initAudio = () => {
    const audio = document.getElementById("audio");
    const audioContext = new window.AudioContext();
    const source = audioContext.createMediaElementSource(audio);

    const splitter = audioContext.createChannelSplitter(2);
    const analyserLeft = audioContext.createAnalyser();
    const analyserRight = audioContext.createAnalyser();

    source.connect(splitter);
    splitter.connect(analyserLeft, 0);
    splitter.connect(analyserRight, 1);

    const merger = audioContext.createChannelMerger(2);
    analyserLeft.connect(merger, 0, 0);
    analyserRight.connect(merger, 0, 1);
    merger.connect(audioContext.destination);

    analyserLeft.fftSize = 256;
    analyserRight.fftSize = 256;

    return { audio, analyserLeft, analyserRight, audioContext };
  };

  let fullScreen = false;
  const handleFullScreen = (e) => {
    fullScreen = !fullScreen;
    if (fullScreen) document.body.requestFullscreen();
    else document.exitFullscreen();
  };

  const initControls = () => {
    let controls = document.getElementById("audio");
    let showTween = null;

    playButton.addEventListener("click", () => {
      controls.play();
    });

    const showControls = () => {
      if (hideTween) hideTween.kill();
      if (!gsap.isTweening(controls))
        showTween = gsap.to(controls, {
          opacity: 1,
          duration: 0.25,
        });
    };

    let hideTween = null;
    const hideControls = () => {
      if (controls.paused || controls.ended) return;
      if (showTween) showTween.kill();
      if (!gsap.isTweening(controls))
        hideTween = gsap.to(controls, {
          opacity: 0,
          duration: 1,
        });
    };

    controls.onmouseover = showControls;
    controls.onmouseout = hideControls;
    controls.addEventListener("ended", showControls);

    audio.addEventListener("play", () => {
      setTimeout(() => {
        if (!controls.paused && !controls.ended) hideControls();
      }, 2000);
    });
  };

  const visualize = (audio, analyserLeft, analyserRight, audioContext) => {
    let bufferLength = analyserLeft.frequencyBinCount;
    const dataArrayLeft = new Uint8Array(bufferLength);
    const dataArrayRight = new Uint8Array(bufferLength);

    audio.addEventListener("play", () => {
      audioContext.resume().then(() => draw());
      playButton.classList.add("hidden");
    });

    audio.src = "SnapOneAnthem.mp3";
    // audio.play();

    let sampleSize = 2;
    let sampleSum = 0;
    let bassLevel = 0;
    let lastBassLevel = 0;
    let bassScale = 0;
    let progress = 0;
    let bassBoostLevel = 0.95;
    let bassBoostAmount = 0;
    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      offScreenContext.clearRect(
        0,
        0,
        offScreenCanvas.width,
        offScreenCanvas.height
      );
      logoContext.clearRect(0, 0, logoCanvas.width, logoCanvas.height);

      analyserLeft.getByteFrequencyData(dataArrayLeft);
      analyserRight.getByteFrequencyData(dataArrayRight);
      visualizer.draw(offScreenContext, dataArrayLeft, dataArrayRight);

      bassLevel = visualizer.levelMax;
      velocity = Math.abs(bassLevel - lastBassLevel);
      lastBassLevel = bassLevel;
      velocity = velocity ^ 5;

      progress = audio.currentTime / audio.duration;
      if (progress > 0.65) {
        sampleSize = 2;
        bassBoostLevel = 1;
        bassBoostAmount = 0.2;
      } else if (progress > 0.62) {
        sampleSize = 10;
        bassBoostAmount = 0.05;
      } else if (progress > 0.23) {
        sampleSize = 3;
        bassBoostAmount = 0.05;
      }

      sampleSum = 0;
      for (let i = 0; i < sampleSize; i++) {
        sampleSum += dataArrayLeft[i];
        sampleSum += dataArrayRight[i];
      }

      bassScale = sampleSum / (sampleSize * 2) / 255;

      logoOpacity = (100 - velocity) / 100;
      if (bassScale < 0.8) {
        bassScale = 0.8;
        logoOpacity = 1;
      }

      if (bassScale >= bassBoostLevel) {
        bassScale += progress * bassBoostAmount;
        logoOpacity = 1;
      }

      if (progress >= 1) bassScale = 1;

      logoCanvas.width = logo.width;
      logoCanvas.height = logo.height;
      logoContext.scale(logoScaleWidth, logoScaleHeight);
      logoContext.scale(bassScale, bassScale);

      logo.x = windowWidth / 2 - (calcLogoWidth * bassScale) / 2;
      logo.y = windowHeight / 2 - (calcLogoHeight * bassScale) / 2;

      logo.draw(logoContext, logoOpacity);

      context.drawImage(offScreenCanvas, 0, 0);
      context.drawImage(logoCanvas, logo.x, logo.y);

      requestAnimationFrame(draw);
    }
  };

  window.addEventListener("resize", handleResize);
  document
    .getElementById("fullscreen")
    .addEventListener("click", handleFullScreen);
  window.onload = function () {
    handleResize();
    initControls();
    const { audio, analyserLeft, analyserRight, audioContext } = initAudio();
    visualize(audio, analyserLeft, analyserRight, audioContext);
  };
})();
fullscreen;
