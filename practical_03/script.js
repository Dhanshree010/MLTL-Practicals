let model;
let metadata;
let wordIndex;
const maxLen = 200;

async function load() {
    console.log("Loading pre-trained model...");

    // Load the model with progress callback
    model = await tf.loadLayersModel(
        "https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json",
        {
            onProgress: (fraction) => {
                console.log(`Model loading: ${(fraction * 100).toFixed(2)}%`);
            }
        }
    );

    console.log("Fetching metadata...");
    metadata = await fetch(
        "https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json"
    ).then(res => res.json());

    wordIndex = metadata.word_index;
    console.log("Metadata loaded. Word index ready.");

    console.log("✅ Model and metadata fully loaded and ready to use!");
}

load();

function pad(seq) {
    if (seq.length > maxLen) {
        seq.splice(0, seq.length - maxLen);
    }
    while (seq.length < maxLen) {
        seq.unshift(0);
    }
    return seq;
}

function predict() {
    let text = document.getElementById("textInput").value.trim().toLowerCase();
    if (text.length == 0) {
        alert("Enter text first");
        return;
    }

    console.log("Input Text:", text);

    let words = text.split(/\s+/);
    console.log("Tokenized Words:", words);

    let sequence = [];
    for (let word of words) {
        let index = wordIndex[word] || 2;
        sequence.push(index);
    }
    console.log("Word Indices Sequence:", sequence);

    sequence = pad(sequence);
    console.log("Padded Sequence:", sequence);

    let tensor = tf.tensor([sequence]);
    console.log("Tensor Shape:", tensor.shape);

    let prediction = model.predict(tensor);
    let score = prediction.dataSync()[0];
    console.log("Raw Model Score (Positive Probability):", score);

    let result = document.getElementById("result");
    let bar = document.getElementById("confidenceBar");

    // Corrected sentiment logic
    let positiveScore = score * 100;
    let negativeScore = (1 - score) * 100;

    if (score >= 0.5) {
        result.innerHTML = `Positive 😊<br>Confidence: ${positiveScore.toFixed(2)}%`;
        result.style.color = "green";
        bar.style.width = positiveScore + "%";
        bar.style.background = "green";
    } else {
        result.innerHTML = `Negative 😞<br>Confidence: ${negativeScore.toFixed(2)}%`;
        result.style.color = "red";
        bar.style.width = negativeScore + "%";
        bar.style.background = "red";
    }
}