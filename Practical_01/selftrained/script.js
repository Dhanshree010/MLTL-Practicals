// ===============================
// SELF-TRAINED DATA (y = 3x + 5)
// ===============================
const x_self = [];
const y_self = [];

for (let i = 0; i < 20; i++) {
    let x = i;
    let y = 3 * x + 5;
    x_self.push(x);
    y_self.push(y);
}

// Normalize data for stability
const x_max = Math.max(...x_self);
const y_max = Math.max(...y_self);

const x_norm = x_self.map(v => v / x_max);
const y_norm = y_self.map(v => v / y_max);

const xs_self = tf.tensor2d(x_norm, [x_norm.length, 1]);
const ys_self = tf.tensor2d(y_norm, [y_norm.length, 1]);

// ===============================
// MODEL DEFINITION
// ===============================
const model = tf.sequential();
model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

model.compile({
    optimizer: tf.train.sgd(0.1), // learning rate
    loss: 'meanSquaredError'
});

// ===============================
// TRAIN MODEL
// ===============================
async function trainModel() {
    await model.fit(xs_self, ys_self, {
        epochs: 200
    });

    // Prediction for x=6
    const input = tf.tensor2d([6 / x_max], [1,1]);
    const pred_norm = model.predict(input);
    
    pred_norm.data().then(data => {
        const pred_value = data[0] * y_max; // denormalize
        console.log("Prediction for x=6:", pred_value.toFixed(2));
    });

    drawGraph();
}

trainModel();

// ===============================
// DRAW GRAPH USING CHART.JS
// ===============================
function drawGraph() {
    const ctx = document.getElementById('myChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: x_self,
            datasets: [
                {
                    label: 'Actual Data (y = 3x + 5)',
                    data: y_self,
                    borderColor: 'blue',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'X values' } },
                y: { title: { display: true, text: 'Y values' } }
            }
        }
    });
}

// ===============================
// SAFE LOCAL STORAGE EXAMPLE
// ===============================
try {
    localStorage.setItem("lastPrediction", "y=3x+5 demo");
} catch(e) {
    console.warn("Cannot access localStorage:", e);
}




