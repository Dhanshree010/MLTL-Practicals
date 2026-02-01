(async () => {
  // ==============================
  // 1. Load pre-trained MNIST CNN model
  // ==============================
  const MODEL_URL = "https://huggingface.co/gaurangdave/mnist_cnn/resolve/main/tfjs_graph_model/model.json";
  console.log("Loading model...");
  const model = await tf.loadGraphModel(MODEL_URL);
  console.log("Model loaded!");

  // ==============================
  // 2. Canvas drawing setup
  // ==============================
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let drawing = false;
  canvas.addEventListener('pointerdown', () => drawing = true);
  canvas.addEventListener('pointerup', () => drawing = false);
  canvas.addEventListener('pointermove', draw);

  function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  document.getElementById('clear').addEventListener('click', () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    document.getElementById('result').innerText = '';
  });

  document.getElementById('predict').addEventListener('click', async () => {
    let img = tf.browser.fromPixels(ctx.getImageData(0,0,canvas.width,canvas.height), 1);
    img = tf.image.resizeBilinear(img, [28, 28]);
    img = img.div(255).reshape([1, 28, 28, 1]);

    // GraphModel uses .execute() or .predict()
    const output = model.predict(img);
    const prediction = output.argMax(-1).dataSync()[0];

    document.getElementById('result').innerText = `Predicted digit: ${prediction}`;
  });
})();
