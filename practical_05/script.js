let model;
const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const detectBtn = document.getElementById("detectBtn");

// Map COCO-SSD objects to emojis for creative overlay
const objectIcons = {
    person: "🧑",
    laptop: "💻",
    book: "📚",
    phone: "📱",
    cup: "☕",
    chair: "🪑",
    bottle: "🥤",
    dog: "🐶",
    cat: "🐱",
    pen: "🖊️",
    keyboard: "⌨️",
    mouse: "🖱️",
    clock: "⏰",
    backpack: "🎒"
};

// Setup webcam with bigger resolution
async function setupWebcam(){
    status.innerText = "Accessing webcam...";
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width:1280, height:720, facingMode:"environment" }
    });
    video.srcObject = stream;
    return new Promise(resolve=>{
        video.onloadedmetadata = () => resolve();
    });
}

// Load model
async function loadModel(){
    status.innerText = "Loading model...";
    model = await cocoSsd.load();
    status.innerText = "Model loaded!";
    detectBtn.disabled = false;
    console.log("Model loaded successfully");
}

// Detect objects (single frame)
async function detectObjects(){
    if(!model) return;

    // Resize canvas to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const predictions = await model.detect(video);

    // Clear previous frame
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Prepare console log
    const consoleOutput = predictions.map(pred=>{
        return `${pred.class} (${(pred.score*100).toFixed(1)}%)`;
    });

    // Log all detected objects
    if(consoleOutput.length>0){
        console.log("Detected Objects:", consoleOutput.join(", "));
    } else {
        console.log("No objects detected in this frame.");
    }

    // Draw predictions on canvas
    predictions.forEach(pred=>{
        const [x,y,width,height] = pred.bbox;

        // Bounding box
        ctx.strokeStyle = "#f43f5e"; // pink/red
        ctx.lineWidth = 3;
        ctx.strokeRect(x,y,width,height);

        // Label + icon
        const icon = objectIcons[pred.class] || "";
        const text = `${icon} ${pred.class} ${(pred.score*100).toFixed(1)}%`;

        // Background rectangle for text
        ctx.font = "18px Arial";
        const textWidth = ctx.measureText(text).width;
        const textHeight = 18;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x-1, y - textHeight, textWidth + 8, textHeight + 6);

        // Draw text on top
        ctx.fillStyle = "#f43f5e";
        ctx.fillText(text, x+3, y-4);
    });
}

// Event listeners
startBtn.addEventListener("click", async ()=>{
    await setupWebcam();
    await loadModel();
});

detectBtn.addEventListener("click", detectObjects);