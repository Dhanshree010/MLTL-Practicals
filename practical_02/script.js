// ===============================
// STEP 4: Load Dataset from JSON
// ===============================
async function loadDataset() {
    const response = await fetch("./mnist.json");
    const data = await response.json();

    console.log("📂 Dataset Loaded:", data);

    const xs = tf.tensor2d(data.images).toFloat();

    // ✅ FIX: one-hot labels + float32
    const labelsTensor = tf.tensor1d(data.labels, "int32");
    const ys = tf.oneHot(labelsTensor, 10).toFloat();

    return { xs, ys };
}

// ===============================
// STEP 5: Create Neural Network
// ===============================
function createModel() {
    const model = tf.sequential();

    model.add(tf.layers.dense({
        inputShape: [10],
        units: 32,
        activation: "relu"
    }));

    model.add(tf.layers.dense({
        units: 10,
        activation: "softmax"
    }));

    model.compile({
        optimizer: "adam",
        loss: "categoricalCrossentropy", // ✅ FIX
        metrics: ["accuracy"]
    });

    console.log("🧠 Model Created");
    return model;
}

// ===============================
// STEP 6: Train Model
// ===============================
async function trainModel() {
    const data = await loadDataset();
    const model = createModel();

    await model.fit(data.xs, data.ys, {
        epochs: 20,
        shuffle: true
    });

    console.log("✅ Model Training Completed");
    return model;
}

// ===============================
// STEP 7: Prediction
// ===============================
async function predictDigit() {
    const model = await trainModel();

    const testSample = tf.tensor2d([[1,1,1,1,0,0,1,1,1,1]]).toFloat();
    const prediction = model.predict(testSample);

    prediction.print();

    const digit = prediction.argMax(1).dataSync()[0];
    console.log("🔢 Predicted Digit:", digit);
}

// ===============================
// RUN PROJECT
// ===============================
predictDigit();
