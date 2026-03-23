const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const poseNameElement = document.getElementById('pose-name');
const exerciseCountElement = document.getElementById('exercise-count');
const accuracyElement = document.getElementById('accuracy');
let net;
let squatCount = 0;
let inSquat = false;
let multiPoseMode = false; // toggle between single and multi-pose

async function setupCamera() {
  video.width = 600;
  video.height = 500;
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

async function loadPoseNet() {
  net = await posenet.load();
  console.log("✅ PoseNet model loaded and ready!");
}

function classifyPose(pose) {
  const leftWrist = pose.keypoints.find(p => p.part === "leftWrist");
  const rightWrist = pose.keypoints.find(p => p.part === "rightWrist");
  const nose = pose.keypoints.find(p => p.part === "nose");

  if (leftWrist && rightWrist && nose) {
    if (leftWrist.position.y < nose.position.y && rightWrist.position.y < nose.position.y) {
      return "Hands Up Pose";
    } else if (leftWrist.position.y < nose.position.y || rightWrist.position.y < nose.position.y) {
      return "Single Hand Raised Pose";
    }
  }
  return "Standing Pose";
}

function calculateAngle(a, b, c) {
  // angle at point b
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  const cosine = dot / (magAB * magCB);
  return Math.acos(cosine) * (180 / Math.PI);
}

function detectSquat(pose) {
  const leftHip = pose.keypoints.find(p => p.part === "leftHip");
  const leftKnee = pose.keypoints.find(p => p.part === "leftKnee");
  const leftAnkle = pose.keypoints.find(p => p.part === "leftAnkle");

  if (leftHip && leftKnee && leftAnkle) {
    const angle = calculateAngle(leftHip.position, leftKnee.position, leftAnkle.position);
    if (angle < 100 && !inSquat) {
      inSquat = true;
    } else if (angle > 160 && inSquat) {
      squatCount++;
      inSquat = false;
      exerciseCountElement.textContent = `Squat Count: ${squatCount}`;
    }
  }
}

async function detectPose() {
  const poses = multiPoseMode
    ? await net.estimateMultiplePoses(video, { flipHorizontal: false, maxDetections: 2 })
    : [await net.estimateSinglePose(video, { flipHorizontal: false })];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  poses.forEach((pose, index) => {
    pose.keypoints.forEach(point => {
      if (point.score > 0.5) {
        ctx.beginPath();
        ctx.arc(point.position.x, point.position.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = index === 0 ? "blue" : "green";
        ctx.fill();
      }
    });

    const poseName = classifyPose(pose);
    poseNameElement.textContent = `Pose: ${poseName}`;
    detectSquat(pose);
    console.log(`Pose ${index + 1}: ${poseName}`);
  });

  accuracyElement.textContent = `Accuracy Mode: ${multiPoseMode ? "Multi-Pose" : "Single-Pose"}`;
}

async function main() {
  await setupCamera();
  video.play();
  await loadPoseNet();

  let frequencySelect = document.getElementById("frequency");
  let interval = parseInt(frequencySelect.value);

  let detectionInterval = setInterval(detectPose, interval);

  frequencySelect.addEventListener("change", () => {
    clearInterval(detectionInterval);
    interval = parseInt(frequencySelect.value);
    detectionInterval = setInterval(detectPose, interval);
  });

  // Toggle accuracy mode every 10 seconds for comparison
  setInterval(() => {
    multiPoseMode = !multiPoseMode;
  }, 10000);
}

main();
