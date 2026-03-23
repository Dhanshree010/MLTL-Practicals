const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const poseNameElement = document.getElementById('pose-name');
let net;

async function setupCamera() {
  video.width = 600;
  video.height = 500;
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true
  });
  video.srcObject = stream;
  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadPoseNet() {
  net = await posenet.load();
  console.log("🎉 PoseNet model successfully loaded and ready!");
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

async function detectPose() {
  const poses = await net.estimateMultiplePoses(video, {
    flipHorizontal: false,
    maxDetections: 2
  });

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
    console.log(`Pose ${index + 1}: ${poseName}`);
  });
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
}

main();
