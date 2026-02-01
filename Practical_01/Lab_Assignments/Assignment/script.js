async function run(learningRate = 0.01) {
  // Synthetic CO₂-like data (x = years, y = CO₂ ppm)
  const xs = tf.tensor1d([1, 2, 3, 4, 5, 6, 7, 8]);
  const ys = tf.tensor1d([2, 4.1, 6.2, 8.1, 10.3, 12.1, 14.2, 16.1]); // approx linear

  // Define model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

  // Compile with chosen learning rate
  model.compile({
    optimizer: tf.train.sgd(learningRate),
    loss: 'meanSquaredError'
  });

  // Train model
  await model.fit(xs, ys, { epochs: 200 });

  // Predict on training data
  const preds = model.predict(xs).dataSync();

  // Predict unseen inputs
  const unseen = tf.tensor1d([9, 10, 11]);
  const unseenPreds = model.predict(unseen).dataSync();
  console.log("Predictions for unseen inputs:", unseenPreds);

  // Plot actual vs predicted
  plotResults(xs.arraySync(), ys.arraySync(), preds);
}

function plotResults(xVals, yVals, preds) {
  const ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Actual Data',
          data: xVals.map((x, i) => ({ x, y: yVals[i] })),
          backgroundColor: 'blue'
        },
        {
          label: 'Predicted Data',
          data: xVals.map((x, i) => ({ x, y: preds[i] })),
          backgroundColor: 'red'
        }
      ]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'X (Years)' } },
        y: { title: { display: true, text: 'Y (CO₂ ppm)' } }
      }
    }
  });
}

// Run with different learning rates
run(0.01);   // Default
// Try run(0.1); or run(0.001); to see convergence differences
