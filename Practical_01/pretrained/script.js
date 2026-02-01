async function run() {
  // Generate synthetic data
  const xs = tf.tensor1d([1, 2, 3, 4]);
  const ys = tf.tensor1d([1.5, 3.5, 5.5, 7.5]); // y = 2x - 0.5

  // Define model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

  // Compile model
  model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

  // Train model
  await model.fit(xs, ys, { epochs: 200 });

  // Predict
  const output = model.predict(tf.tensor1d([5, 6, 7]));
  output.print();

  // Save model
  await model.save('downloads://pretrained-model');
}

run();
