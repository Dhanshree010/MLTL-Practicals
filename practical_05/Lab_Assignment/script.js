let model;

const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const labelText = document.getElementById("label");
const fpsText = document.getElementById("fps");

const startBtn = document.getElementById("startBtn");
const detectBtn = document.getElementById("detectBtn");

let frameCount = 0;
let lastTime = performance.now();

async function startCamera(){

const stream = await navigator.mediaDevices.getUserMedia({video:true});

video.srcObject = stream;

video.onloadedmetadata = () => {

canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

};

console.log("Camera started");

}

async function loadModel(){

console.log("Loading MobileNet...");

model = await mobilenet.load();

console.log("Model loaded");

}

async function detectObject(){

if(!model) return;

const predictions = await model.classify(video);

const objectName = predictions[0].className;
const confidence = (predictions[0].probability * 100).toFixed(2);

labelText.innerText = `Object: ${objectName} (${confidence}%)`;

console.log(`Detected: ${objectName} - ${confidence}%`);

ctx.clearRect(0,0,canvas.width,canvas.height);

ctx.font = "24px Arial";
ctx.fillStyle = "red";

ctx.fillText(

`${objectName} (${confidence}%)`,
20,
40

);

// FPS calculation
frameCount++;

const now = performance.now();

const delta = (now-lastTime)/1000;

if(delta>=1){

const fps = Math.round(frameCount/delta);

fpsText.innerText = `FPS: ${fps}`;

frameCount = 0;
lastTime = now;

}

}

startBtn.addEventListener("click", async()=>{

await startCamera();
await loadModel();

});

detectBtn.addEventListener("click", detectObject);