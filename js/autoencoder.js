let latentData = [];
let decoder;
const imgWidth = 64, imgHeight = 64;

const outputCanvas = document.getElementById('outputCanvas');
const inputX = document.getElementById('inputX');
const inputY = document.getElementById('inputY');
const showBtn = document.getElementById('showBtn');
const toggleMoveBtn = document.getElementById('toggleMoveBtn');
let moveMode = false;

// archivos JSON
// archivos JSON
const latentFile = "assets/latent_representations.json";
const imageFile = "assets/image_filenames.json";
const decoderParts = [
  "assets/decoder_part1.json",
  "assets/decoder_part2.json",
  "assets/decoder_part3.json"
  // agregar todos los fragmentos
];

// cargar todo
Promise.all([
  fetch(latentFile).then(r => r.json()),
  fetch(imageFile).then(r => r.json()),
  Promise.all(decoderParts.map(f => fetch(f).then(r => r.json())))
])
  .then(([latData, imgData, decParts]) => {
    // reconstruir decoder_weights completo
    let decoder_weights = [];
    decParts.forEach(p => decoder_weights = decoder_weights.concat(p));

    const data = {
      latent_representations: latData.latent_representations,
      decoder_weights: decoder_weights,
      image_filenames: imgData.image_filenames
    };

    latentData = data.latent_representations.map(v => ({ x: v[0], y: v[1] }));

    // --- Plot dataset ---
    const trace = {
      x: latentData.map(p => p.x),
      y: latentData.map(p => p.y),
      mode: 'markers',
      type: 'scattergl',
      marker: { size: 5, color: 'blue' },
      name: "dataset"
    };

    const markerTrace = {
      x: [],
      y: [],
      mode: 'markers',
      type: 'scattergl',
      marker: { size: 10, color: 'red' },
      name: "selected"
    };

    const layout = {
      dragmode: 'pan',
      hovermode: false,
      margin: { l: 40, r: 10, b: 40, t: 10 },
      xaxis: { title: "Latent X", zeroline: false },
      yaxis: { title: "Latent Y", zeroline: false }
    };

    Plotly.newPlot('plot', [trace, markerTrace], layout, { scrollZoom: true });

    // --- Build decoder ---
    buildDecoder(data.decoder_weights);

    // listeners del grÃ¡fico
    const plotDiv = document.getElementById('plot');
    plotDiv.addEventListener("click", evt => {
      if (moveMode) return;
      const coords = screenToData(evt, plotDiv);
      if (coords) updateAndShow(coords.x, coords.y);
    });
    plotDiv.addEventListener("mousemove", evt => {
      if (!moveMode) return;
      const coords = screenToData(evt, plotDiv);
      if (coords) updateAndShow(coords.x, coords.y);
    });

  })
  .catch(err => {
    console.error("Error cargando JSONs:", err);
    alert("Error al cargar los archivos JSON:\n" + err.message);
  });

// --- Funciones ---
function buildDecoder(weights) {
  decoder = tf.sequential();
  const layerUnits = weights.map(w => w[1].length);
  decoder.add(tf.layers.dense({ inputShape: [2], units: layerUnits[0], activation: 'relu' }));
  for (let i = 1; i < layerUnits.length - 1; i++) {
    decoder.add(tf.layers.dense({ units: layerUnits[i], activation: 'relu' }));
  }
  decoder.add(tf.layers.dense({ units: layerUnits[layerUnits.length - 1], activation: 'sigmoid' }));

  for (let i = 0; i < decoder.layers.length; i++) {
    const wData = weights[i][0].map(row => row.map(Number));
    const bData = weights[i][1].map(Number);
    decoder.layers[i].setWeights([tf.tensor2d(wData), tf.tensor1d(bData)]);
  }
}

async function showImage(xVal, yVal) {
  if (!decoder) return;
  const latentVec = tf.tensor2d([[xVal, yVal]]);
  let decoded = decoder.predict(latentVec).reshape([imgHeight * imgWidth]);
  const size = decoded.size;

  let finalImg;
  if (size === imgWidth * imgHeight) {
    finalImg = decoded.reshape([imgHeight, imgWidth, 1]);
    finalImg = finalImg.concat(finalImg, -1).concat(finalImg, -1);
  } else if (size === imgWidth * imgHeight * 3) {
    finalImg = decoded.reshape([imgHeight, imgWidth, 3]);
  } else { console.error("TamaÃ±o inesperado de salida:", size); return; }

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = imgWidth;
  tempCanvas.height = imgHeight;
  await tf.browser.toPixels(finalImg, tempCanvas);

  const outCtx = outputCanvas.getContext("2d");
  outCtx.imageSmoothingEnabled = false;
  outCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  outCtx.drawImage(tempCanvas, 0, 0, outputCanvas.width, outputCanvas.height);

  tf.dispose([latentVec, decoded, finalImg]);
}

function updateAndShow(xVal, yVal) {
  inputX.value = xVal.toFixed(2);
  inputY.value = yVal.toFixed(2);
  showImage(xVal, yVal);

  Plotly.restyle('plot', { x: [[xVal]], y: [[yVal]] }, [1]);
}

function screenToData(evt, plotDiv) {
  const bb = plotDiv.getBoundingClientRect();
  const xRel = evt.clientX - bb.left;
  const yRel = evt.clientY - bb.top;
  const gd = plotDiv._fullLayout;
  const xaxis = gd.xaxis;
  const yaxis = gd.yaxis;
  if (!xaxis || !yaxis) return null;
  return { x: xaxis.p2l(xRel), y: yaxis.p2l(yRel) };
}

showBtn.addEventListener('click', () => {
  showImage(parseFloat(inputX.value), parseFloat(inputY.value));
});

toggleMoveBtn.addEventListener('click', () => {
  moveMode = !moveMode;
  toggleMoveBtn.textContent = moveMode ? "ðŸ”„ Modo mover: ON" : "ðŸ”„ Modo mover: OFF";
});
