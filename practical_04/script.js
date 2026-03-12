let model;

async function init(){
    console.log("Loading MobileNet...");
    model = await mobilenet.load({version:2, alpha:1.0});
    console.log("MobileNet Loaded Successfully!");
}

init();

const upload = document.getElementById("upload");
const preview = document.getElementById("preview");
const results = document.getElementById("results");

upload.addEventListener("change", async function(e){

    const file = e.target.files[0];
    if(!file) return;

    preview.src = URL.createObjectURL(file);
    preview.hidden = false;

    preview.onload = async function(){

        console.log("Analyzing image...");

        const predictions = await model.classify(preview,3);

        results.innerHTML = "";

        predictions.forEach(p => {

            const percent = (p.probability*100).toFixed(2);

            const div = document.createElement("div");

            div.innerText = `${p.className} — ${percent}%`;

            results.appendChild(div);

        });

        console.log("Predictions:", predictions);

    };

});