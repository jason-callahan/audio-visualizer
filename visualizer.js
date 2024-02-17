"use strict";

const MAX_LEVEL = 255;
var v;
export var visualizer = {
  barWidth: 0,
  barHeightMultiplier: 2,
  bufferLength: 106,
  canvasHeight: 1080,
  canvasWidth: 1920,
  offsetY: 0,
  colorLeft: { r: 52, g: 166, b: 255 },
  colorRight: { r: 255, g: 102, b: 0 },
  levelMax: 0,

  levelLeft: 0,
  levelRight: 0,
  barHeightLeft: 0,
  barHeightRight: 0,
  opacityLeft: 0,
  opacityRight: 0,
  yPosLeft: 0,
  yPosRight: 0,
  xLeft: 0,
  xRight: 0,
  i: 0,

  draw: (ctx, dataArrayLeft, dataArrayRight) => {
    v = visualizer;

    v.levelMax = 0;
    v.barWidth = Math.floor(v.canvasWidth / v.bufferLength / 2);
    v.xLeft = v.canvasWidth / 2 - v.barWidth - 0.5;
    v.xRight = v.canvasWidth / 2 + 0.5;
    for (v.i = 0; v.i < v.bufferLength; v.i++) {
      v.levelLeft = dataArrayLeft[v.i];
      v.levelRight = dataArrayRight[v.i];

      if (v.levelLeft > v.levelMax) v.levelMax = v.levelLeft;
      if (v.levelRight > v.levelMax) v.levelMax = v.levelRight;

      v.barHeightLeft = v.levelLeft * v.barHeightMultiplier;
      v.barHeightRight = v.levelRight * v.barHeightMultiplier;
      v.opacityLeft = v.levelLeft / MAX_LEVEL;
      v.opacityRight = v.levelRight / MAX_LEVEL;
      v.yPosLeft = v.canvasHeight + v.offsetY - v.barHeightLeft;
      v.yPosRight = v.canvasHeight + v.offsetY - v.barHeightRight;

      // draw the left side bar
      ctx.fillStyle = `rgba(${v.colorLeft.r},${v.colorLeft.g},${v.colorLeft.b},${v.opacityLeft})`;
      ctx.fillRect(v.xLeft, v.yPosLeft, v.barWidth, v.barHeightLeft);

      // draw the right side bar
      ctx.fillStyle = `rgba(${v.colorRight.r},${v.colorRight.g},${v.colorRight.b},${v.opacityRight})`;
      ctx.fillRect(v.xRight, v.yPosRight, v.barWidth, v.barHeightRight);

      v.xLeft -= v.barWidth + 1;
      v.xRight += v.barWidth + 1;
    }
  },
};

export default visualizer;
