let pointsX = [];
let numPoints = 21; // 增加頂點數量，使曲線更平滑流暢
let topY = [];
let bottomY = [];
let gameState = "WAIT"; // 狀態管理：WAIT (等待), PLAY (遊玩中), LOSE (失敗), WIN (成功)
let maxTime = 30; // 遊戲通關限制時間延長為 30 秒
let startTime = 0; // 記錄遊戲開始時的毫秒數
let timeLeft = maxTime; // 當下的剩餘時間
let gapMin = 50; // 通道最小寬度調寬
let gapMax = 80; // 通道最大寬度調寬
let currentLevel = 1; // 記錄目前關卡
let failTime = 0; // 記錄失敗瞬間的毫秒數，用於閃爍特效
let stars = []; // 星空粒子陣列

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 自動計算均勻分佈的 X 座標
  for (let i = 0; i < numPoints; i++) {
    pointsX.push(50 + ((width - 100) / (numPoints - 1)) * i);
  }
  // 產生隨機星空
  for (let i = 0; i < 150; i++) {
    stars.push({ x: random(windowWidth), y: random(windowHeight), size: random(1, 3) });
  }
  generatePath();
}

function generatePath() {
  topY = [];
  bottomY = [];
  let noiseY = random(1000); // 隨機 height noise 起點
  let noiseGap = random(2000); // 獨立的 gap noise 起點
  
  // 根據關卡數動態計算彎度 (步進值)：降低初始彎度與每關增加的幅度
  let stepY = 0.15 + (currentLevel * 0.03);
  
  for (let i = 0; i < numPoints; i++) {
    // 利用 Perlin Noise 生成平滑連續的高低起伏
    let ty = map(noise(noiseY), 0, 1, 50, height - 60);
    topY.push(ty);
    
    // 寬度也使用 noise 平滑變化，避免下邊界出現鋸齒抖動
    let gap = map(noise(noiseGap), 0, 1, gapMin, gapMax);
    bottomY.push(ty + gap);
    
    // 套用動態計算的彎度步進值
    noiseY += stepY;
    noiseGap += 0.1;
  }
}

function draw() {
  background(10, 15, 40); // 替換為星空深藍色

  // 畫出背景的星星
  fill(255, 255, 255, 150);
  noStroke();
  for (let s of stars) {
    circle(s.x, s.y, s.size);
  }

  // 繪製安全通道的底色區塊 (改為深紫藍色，以覆蓋軌道內的星星)
  fill(20, 20, 50);
  noStroke();
  beginShape();
  // 上邊界 (由左至右)
  curveVertex(pointsX[0], topY[0]);
  for (let i = 0; i < numPoints; i++) curveVertex(pointsX[i], topY[i]);
  curveVertex(pointsX[numPoints - 1], topY[numPoints - 1]);
  // 下邊界 (由右至左)
  curveVertex(pointsX[numPoints - 1], bottomY[numPoints - 1]);
  for (let i = numPoints - 1; i >= 0; i--) curveVertex(pointsX[i], bottomY[i]);
  curveVertex(pointsX[0], bottomY[0]);
  endShape(CLOSE);

  // 使用 curveVertex 指令畫出上下邊界線條
  stroke(0, 255, 255); // 替換為霓虹青色
  strokeWeight(4);     // 加粗線條
  noFill();
  
  // 利用 drawingContext 開啟發光 (Glow) 特效
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(0, 255, 255);
  
  beginShape(); // 上線條
  curveVertex(pointsX[0], topY[0]);
  for (let i = 0; i < numPoints; i++) curveVertex(pointsX[i], topY[i]);
  curveVertex(pointsX[numPoints - 1], topY[numPoints - 1]);
  endShape();

  beginShape(); // 下線條
  curveVertex(pointsX[0], bottomY[0]);
  for (let i = 0; i < numPoints; i++) curveVertex(pointsX[i], bottomY[i]);
  curveVertex(pointsX[numPoints - 1], bottomY[numPoints - 1]);
  endShape();

  // 計算並畫出起點(左邊藍色)與終點(右邊紅色)
  let startY = (topY[0] + bottomY[0]) / 2;
  let endY = (topY[numPoints - 1] + bottomY[numPoints - 1]) / 2;
  
  noStroke();
  fill(0, 150, 255);
  drawingContext.shadowColor = color(0, 150, 255);
  circle(pointsX[0], startY, 15); // 開始鍵
  
  fill(255, 50, 50);
  drawingContext.shadowColor = color(255, 50, 50);
  circle(pointsX[numPoints - 1], endY, 15);   // 結束點

  // 關閉發光特效，避免後續文字也跟著發光
  drawingContext.shadowBlur = 0;

  // 顯示倒數計時器
  fill(255); // 文字改為白色以適應深色背景
  textSize(20);
  textAlign(LEFT, TOP);
  if (gameState === "WAIT") {
    text("剩餘時間: " + maxTime + " 秒", 10, 10);
  } else if (gameState === "PLAY") {
    timeLeft = maxTime - floor((millis() - startTime) / 1000);
    text("剩餘時間: " + timeLeft + " 秒", 10, 10);
    if (timeLeft <= 0) {
      gameState = "LOSE"; // 時間到，判斷失敗
      failTime = millis(); // 記錄失敗時間
    }
  } else if (gameState === "LOSE" || gameState === "WIN") {
    text("剩餘時間: " + max(0, timeLeft) + " 秒", 10, 10);
  }
  text("關卡: " + currentLevel, 10, 35); // 在計時器下方顯示當前關卡

  // 遊戲狀態邏輯與畫面提示
  if (gameState === "WAIT") {
    fill(255); // 白色字體
    textSize(20);
    textAlign(CENTER, CENTER);
    text("點擊左側藍色圓點開始遊戲\n(滑鼠不可碰到邊界或移出線外)", width / 2, 80);
  } else if (gameState === "PLAY") {
    // 判斷滑鼠是否移出軌道外，包含往回跑 (移出最左邊界) 或離開視窗
    if (mouseX <= pointsX[0] - 5 || mouseX < 0 || mouseY < 0 || mouseY > height) {
      gameState = "LOSE";
      failTime = millis();
    } else if (mouseX >= pointsX[numPoints - 1]) {
      gameState = "WIN"; // 移到最右邊的結束點，就代表遊戲成功
    } else {
      // 計算目前滑鼠所在的區段，並利用 curvePoint 算出當下 X 位置精確的上下 Y 座標
      for (let i = 0; i < numPoints - 1; i++) {
        if (mouseX >= pointsX[i] && mouseX <= pointsX[i + 1]) {
          let t = (mouseX - pointsX[i]) / (pointsX[i + 1] - pointsX[i]);
          
          // 取得控制點進行曲線內插 (curvePoint)
          let ty0 = topY[max(0, i - 1)];
          let ty1 = topY[i];
          let ty2 = topY[i + 1];
          let ty3 = topY[min(numPoints - 1, i + 2)];
          let currentTop = curvePoint(ty0, ty1, ty2, ty3, t);
          
          let by0 = bottomY[max(0, i - 1)];
          let by1 = bottomY[i];
          let by2 = bottomY[i + 1];
          let by3 = bottomY[min(numPoints - 1, i + 2)];
          let currentBottom = curvePoint(by0, by1, by2, by3, t);
          
          // 如果滑鼠碰到或超出了上下邊界
          if (mouseY <= currentTop || mouseY >= currentBottom) {
            gameState = "LOSE";
            failTime = millis();
          }
          break;
        }
      }
    }
    
    // 遊戲進行中，畫一個小紅點跟隨滑鼠，代表電流急急棒本身
    fill(255, 50, 50);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(255, 50, 50);
    circle(mouseX, mouseY, 8); // 稍微放大一點點
    drawingContext.shadowBlur = 0; // 重置
    
  } else if (gameState === "LOSE") {
    // 碰撞瞬間的紅色閃爍特效 (持續 500 毫秒淡出)
    let flashAlpha = map(millis() - failTime, 0, 500, 150, 0); // 透明度由 150 降至 0
    flashAlpha = constrain(flashAlpha, 0, 255);
    noStroke();
    fill(255, 0, 0, flashAlpha);
    rect(0, 0, width, height); // 畫一個覆蓋全畫面的半透明紅框

    fill(255, 0, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("失敗！", width / 2, height / 2);
    textSize(20);
    text("點擊畫面重新開始", width / 2, height / 2 + 50);
  } else if (gameState === "WIN") {
    fill(0, 200, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("遊戲成功！", width / 2, height / 2);
    textSize(20);
    text("點擊畫面重新開始", width / 2, height / 2 + 50);
  }
}

function mousePressed() {
  if (gameState === "WAIT") {
    // 點擊左側起點(開始鍵)才開始遊戲
    let startY = (topY[0] + bottomY[0]) / 2;
    if (dist(mouseX, mouseY, pointsX[0], startY) < 15) {
      gameState = "PLAY";
      startTime = millis(); // 點擊時記錄當下的時間，開始計時
    }
  } else if (gameState === "LOSE" || gameState === "WIN") {
    if (gameState === "WIN") {
      currentLevel++; // 進入下一關
      gapMax = max(10, gapMax - 5); // 成功過關，最大寬度變窄 5 (限制最小為 10)
      gapMin = max(10, gapMin - 2); // 最小寬度變窄 2 (限制最小為 10)
    } else {
      currentLevel = 1; // 失敗則重置關卡
      gapMin = 50;      // 重置寬度限制
      gapMax = 80;
    }
    // 重新產生新關卡並回到等待畫面
    generatePath();
    gameState = "WAIT";
    timeLeft = maxTime; // 重置計時器
  }
}
