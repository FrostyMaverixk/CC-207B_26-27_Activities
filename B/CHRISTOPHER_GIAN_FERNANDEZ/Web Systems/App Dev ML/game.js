// ========================================
// TEACHABLE MACHINE MODEL
// ========================================

const URL = "https://teachablemachine.withgoogle.com/models/im8ZX1FoH/";

let model;
let webcam;
let maxPredictions;

// ========================================
// GAME VARIABLES
// ========================================

const player = document.getElementById("player");
const predictionText = document.getElementById("prediction");
const confidenceText = document.getElementById("confidence");

let playerX = 100;
let playerY = 20;
let isJumping = false;

// ========================================
// START AI
// ========================================

async function startAI() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // Load Teachable Machine model
  model = await tmImage.load(modelURL, metadataURL);

  maxPredictions = model.getTotalClasses();

  // Create webcam
  const flip = true;
  const cameraFrameRate = 60;

  webcam = new tmImage.Webcam(300, 300, flip);

  await webcam.setup({ frameRate: cameraFrameRate });
  await webcam.play();

  // Put webcam on webpage
  webcam.canvas.classList.add("camera-feed");
  document.getElementById("webcam-container").appendChild(webcam.canvas);

  // Start webcam + AI loop
  window.requestAnimationFrame(loop);
}

// ========================================
// WEBCAM + AI LOOP
// ========================================

// The webcam updates continuously.
// AI prediction runs less frequently so
// the webcam stays smoother.

let lastPredictionTime = 0;

const AI_INTERVAL = 80; // About 12.5 AI predictions per second

let predictionRunning = false;

function loop(timestamp) {
  // Keep webcam updating continuously
  webcam.update();

  // Only run AI if the previous prediction
  // has already finished
  if (timestamp - lastPredictionTime >= AI_INTERVAL && !predictionRunning) {
    lastPredictionTime = timestamp;

    predictionRunning = true;

    predict().finally(() => {
      predictionRunning = false;
    });
  }

  // Continue the webcam loop
  window.requestAnimationFrame(loop);
}

// ========================================
// PREDICT HAND GESTURE
// ========================================

async function predict() {
  const prediction = await model.predict(webcam.canvas);

  // Find prediction with highest confidence
  let highestPrediction = prediction[0];

  for (let i = 1; i < prediction.length; i++) {
    if (prediction[i].probability > highestPrediction.probability) {
      highestPrediction = prediction[i];
    }
  }

  const gesture = highestPrediction.className;
  const confidence = highestPrediction.probability;

  // ========================================
  // DISPLAY PREDICTION
  // ========================================

  predictionText.textContent = "Prediction: " + gesture;

  confidenceText.textContent =
    "Confidence: " + (confidence * 100).toFixed(1) + "%";

  // ========================================
  // GAME CONTROLS
  // ========================================

  // Only react if AI is reasonably confident

  if (confidence > 0.7) {
    if (gesture === "Left") {
      moveLeft();
    } else if (gesture === "Right") {
      moveRight();
    } else if (gesture === "Jump") {
      jump();
    }
  }
}

// ========================================
// MOVE LEFT
// ========================================

function moveLeft() {
  playerX -= 10;

  if (playerX < 0) {
    playerX = 0;
  }

  updatePlayer();
}

// ========================================
// MOVE RIGHT
// ========================================

function moveRight() {
  playerX += 10;

  if (playerX > 730) {
    playerX = 730;
  }

  updatePlayer();
}

// ========================================
// JUMP
// ========================================

function jump() {
  // Don't jump while already jumping

  if (isJumping) {
    return;
  }

  isJumping = true;

  playerY = 150;

  updatePlayer();

  // Bring player back down after 500ms

  setTimeout(() => {
    playerY = 20;

    updatePlayer();

    isJumping = false;
  }, 500);
}

// ========================================
// UPDATE PLAYER
// ========================================

function updatePlayer() {
  player.style.left = playerX + "px";

  player.style.bottom = playerY + "px";
}

// ========================================
// START EVERYTHING
// ========================================

startAI();
