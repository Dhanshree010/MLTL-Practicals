let model, reloadedModel;

// 1️⃣ Train the model
document.getElementById('trainBtn').addEventListener('click', async () => {
  model = tf.sequential();
  model.add(tf.layers.dense({units: 1, inputShape: [1]}));
  model.compile({optimizer: 'sgd', loss: 'meanSquaredError'});

  const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
  const ys = tf.tensor2d([3, 5, 7, 9], [4, 1]);

  await model.fit(xs, ys, {epochs: 200});
  console.log("✅ Model trained!");
});

// 2️⃣ Save the model
document.getElementById('saveBtn').addEventListener('click', async () => {
  if (!model) return console.warn("Model not trained yet!");
  await model.save('localstorage://my-tfjs-model');
  console.log("💾 Model saved to browser localStorage!");
});

// 3️⃣ Reload the model
document.getElementById('reloadBtn').addEventListener('click', async () => {
  reloadedModel = await tf.loadLayersModel('localstorage://my-tfjs-model');
  console.log("🔄 Model reloaded from localStorage!");
});

// 4️⃣ Predict with original model
document.getElementById('predictOriginalBtn').addEventListener('click', () => {
  const val = parseFloat(document.getElementById('inputVal').value);
  if (!model) return console.warn("Original model not trained!");
  const input = tf.tensor2d([val], [1, 1]);
  const output = model.predict(input);
  output.print();
  console.log(`Original Model Prediction for ${val}: ${output.dataSync()[0].toFixed(2)}`);
});

// 5️⃣ Predict with reloaded model
document.getElementById('predictReloadBtn').addEventListener('click', () => {
  const val = parseFloat(document.getElementById('inputVal').value);
  if (!reloadedModel) return console.warn("Reloaded model not loaded!");
  const input = tf.tensor2d([val], [1, 1]);
  const output = reloadedModel.predict(input);
  output.print();
  console.log(`Reloaded Model Prediction for ${val}: ${output.dataSync()[0].toFixed(2)}`);
});

// 6️⃣ Export model
document.getElementById('exportBtn').addEventListener('click', async () => {
  if (!model) return console.warn("No model to export!");
  await model.save('downloads://my-tfjs-model');
  console.log("🛫 Model exported as downloadable files!");
});