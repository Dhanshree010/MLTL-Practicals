// Dataset (expanded)
const sentences = [
  {text:"I love this product", label:1},
  {text:"This is amazing", label:1},
  {text:"I am so happy today", label:1},
  {text:"Absolutely fantastic experience", label:1},
  {text:"Best day of my life", label:1},
  {text:"I am thrilled with this", label:1},
  {text:"Wonderful and excellent", label:1},
  {text:"I hate this", label:0},
  {text:"This is terrible", label:0},
  {text:"I am so sad", label:0},
  {text:"Worst experience ever", label:0},
  {text:"I will never buy this again", label:0},
  {text:"Awful and disappointing", label:0},
  {text:"Horrible day", label:0}
];

// Text preprocessing
function cleanText(text){
  return text.toLowerCase().replace(/[^\w\s]/gi,'');
}

// Tokenization
let wordIndex={}, indexWord={}, maxLen=10;
function tokenize() {
  let index=1;
  sentences.forEach(s=>{
    cleanText(s.text).split(' ').forEach(w=>{
      if(!wordIndex[w]) { wordIndex[w]=index; indexWord[index]=w; index++; }
    });
  });
}
tokenize();

// Encode sentence
function encodeSentence(sentence){
  let arr=cleanText(sentence).split(' ').map(w=>wordIndex[w]||0);
  while(arr.length<maxLen) arr.push(0);
  if(arr.length>maxLen) arr=arr.slice(0,maxLen);
  return arr;
}

// Tensors (Dense=float32, RNN=int32)
const xsDense = tf.tensor2d(sentences.map(s=>encodeSentence(s.text)), undefined, 'float32');
const xsRNN   = tf.tensor2d(sentences.map(s=>encodeSentence(s.text)), undefined, 'int32');
const ysTensor = tf.tensor2d(sentences.map(s=>[s.label]));

// Dense Model
let denseModel;
function createDenseModel(){
  const model=tf.sequential();
  model.add(tf.layers.dense({inputShape:[maxLen],units:32,activation:'relu'}));
  model.add(tf.layers.dense({units:16,activation:'relu'}));
  model.add(tf.layers.dense({units:1,activation:'sigmoid'}));
  model.compile({optimizer:'adam',loss:'binaryCrossentropy',metrics:['accuracy']});
  return model;
}

// RNN Model (fixed)
let rnnModel;
function createRNNModel(){
  const model=tf.sequential();
  model.add(tf.layers.embedding({
    inputDim:Object.keys(wordIndex).length+1,
    outputDim:16,
    inputLength:maxLen
  }));
  model.add(tf.layers.lstm({units:32})); // increased units
  model.add(tf.layers.dense({units:1,activation:'sigmoid', biasInitializer:'zeros'}));
  model.compile({optimizer:'adam',loss:'binaryCrossentropy',metrics:['accuracy']});
  return model;
}

// Train Models
async function trainModels(){
  denseModel=createDenseModel();
  rnnModel=createRNNModel();
  const progressBar=document.getElementById('progressBar');

  console.log("🚀 Training Dense Model...");
  await denseModel.fit(xsDense, ysTensor, {epochs:100, shuffle:true, callbacks:{
    onEpochEnd:(epoch,logs)=>{
      console.log(`Dense Epoch ${epoch+1}: Loss=${logs.loss.toFixed(3)}, Acc=${logs.acc?.toFixed(3)||logs.acc}`);
      progressBar.style.width=`${Math.floor(((epoch+1)/100)*50)}%`;
      progressBar.innerText=`Dense ${epoch+1}/100`;
    }
  }});
  console.log("✅ Dense Model Trained!");

  console.log("🚀 Training RNN Model...");
  await rnnModel.fit(xsRNN, ysTensor, {epochs:200, shuffle:true, callbacks:{
    onEpochEnd:(epoch,logs)=>{
      console.log(`RNN Epoch ${epoch+1}: Loss=${logs.loss.toFixed(3)}, Acc=${logs.acc?.toFixed(3)||logs.acc}`);
      progressBar.style.width=`${50+Math.floor(((epoch+1)/200)*50)}%`;
      progressBar.innerText=`RNN ${epoch+1}/200`;
    }
  }});
  console.log("✅ RNN Model Trained!");
  progressBar.style.width='100%';
  progressBar.innerText='Training Complete ✅';
}

// Predict sentiment
async function predictSentiment(){
  const text=document.getElementById('inputText').value;
  const modelType=document.getElementById('modelType').value;
  if(!text) return alert("Please type a sentence.");

  let encoded = encodeSentence(text);
  let inputTensor;

  if(modelType==='dense'){
    inputTensor = tf.tensor2d([encoded], undefined, 'float32'); // for Dense
  } else {
    inputTensor = tf.tensor2d([encoded], [1, encoded.length], 'int32'); // for RNN
  }

  const prediction=modelType==='dense'? denseModel.predict(inputTensor) : rnnModel.predict(inputTensor);
  const score=(await prediction.data())[0];
  const sentiment=score>0.5 ? 'Positive 😊' : 'Negative 😞';
  document.getElementById('result').innerText=`Sentiment: ${sentiment} (Confidence: ${score.toFixed(2)})`;
  console.log(`Prediction for "${text}": ${score.toFixed(3)} -> ${sentiment}`);
}