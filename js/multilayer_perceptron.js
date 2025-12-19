/* ---------------- DATASETS ---------------- */
const datasets = {
  "Dataset1": {
    X: [
      [1.1946, 3.9502], [3.9788, 1.6595], [1.1907, 1.6117], [2.6180, 3.8272],
      [0.2032, 1.9208], [3.7946, 0.9502], [3.8946, 2.1502], [2.1946, 3.9502],
      [2.9571, 1.9931], [2.7125, 2.8166], [1.9392, 1.1032], [2.2072, 0.9123],
      [2.4799, 1.9982], [2.4763, 0.8020]
    ],
    y: [1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1]
  }
};

// dataset activo
let currentDataset = datasets["Dataset1"];

/* ---------------- STATE ---------------- */
let neurons = [];
let outputWeights = [];
let outputBias = 0;
const rand = () => (Math.random() * 2 - 1);

/* init */
function initPlayground(n = parseInt(document.getElementById('play_neurons').value)) {
  neurons = [];
  for (let i = 0; i < n; i++) neurons.push({ w1: rand(), w2: rand(), b: rand() });
  outputWeights = Array(n).fill(0).map(() => rand());
  outputBias = rand();
  renderControls();
  updatePlaygroundMLP();
}

/* MLP forward */
function mlpOutput(x, y, mode = 'binary') {
  const act = document.getElementById('activation_mode').value;
  // hidden activación
  const hidden = neurons.map(n => {
    const z = n.w1 * x + n.w2 * y + n.b;
    return (act === 'tanh') ? Math.tanh(z) : z;
  });

  let sum = hidden.reduce((s, h, j) => s + outputWeights[j] * h, outputBias);

  // salida
  if (act === 'tanh') {
    const out = Math.tanh(sum);
    return (mode === 'binary') ? (Math.sign(out) || 1) : out;
  } else { // lineal
    return (mode === 'binary') ? (sum >= 0 ? 1 : -1) : sum;
  }
}

/* resto igual que antes */
function renderControls() {
  const cont = document.getElementById('play_neurons_controls');
  cont.innerHTML = '';
  neurons.forEach((ne, i) => { /* igual que antes */
    const block = document.createElement('div');
    block.className = 'neuron';
    block.innerHTML = `
      <div><strong>Neurona ${i + 1}</strong></div>
      <label class="small">w₁ <span id="val_n${i}_w1">${ne.w1.toFixed(2)}</span></label>
      <input id="n${i}_w1" data-i="${i}" data-type="w1" type="range" min="-2" max="2" step="0.01" value="${ne.w1}">
      <label class="small">w₂ <span id="val_n${i}_w2">${ne.w2.toFixed(2)}</span></label>
      <input id="n${i}_w2" data-i="${i}" data-type="w2" type="range" min="-2" max="2" step="0.01" value="${ne.w2}">
      <label class="small">b <span id="val_n${i}_b">${ne.b.toFixed(2)}</span></label>
      <input id="n${i}_b" data-i="${i}" data-type="b" type="range" min="-5" max="5" step="0.01" value="${ne.b}">
    `;
    cont.appendChild(block);
  });

  const out = document.getElementById('play_output_controls'); out.innerHTML = '';
  outputWeights.forEach((w, j) => {
    const wdiv = document.createElement('div');
    wdiv.innerHTML = `
      <label class="small">w_out[${j + 1}] <span id="val_out_w${j}">${w.toFixed(2)}</span></label>
      <input id="out_w${j}" data-j="${j}" data-type="out_w" type="range" min="-2" max="2" step="0.01" value="${w}">
    `;
    out.appendChild(wdiv);
  });
  const biasDiv = document.createElement('div');
  biasDiv.innerHTML = `
    <label class="small">b_out <span id="val_out_b">${outputBias.toFixed(2)}</span></label>
    <input id="out_b" data-type="out_b" type="range" min="-5" max="5" step="0.01" value="${outputBias}">
  `;
  out.appendChild(biasDiv);

  document.querySelectorAll('input[type=range]').forEach(inp => {
    inp.oninput = handleParamInput;
  });
  document.getElementById('resetBtn').onclick = () => { neurons.forEach(n => { n.w1 = 0; n.w2 = 0; n.b = 0; }); outputWeights.fill(0); outputBias = 0; syncStateToDOM(); updatePlaygroundMLP(); };
  document.getElementById('randomizeBtn').onclick = () => { neurons.forEach(n => { n.w1 = rand(); n.w2 = rand(); n.b = rand(); }); outputWeights = outputWeights.map(() => rand()); outputBias = rand(); syncStateToDOM(); updatePlaygroundMLP(); };
}

function syncStateToDOM() {
  neurons.forEach((n, i) => { ['w1', 'w2', 'b'].forEach(t => { const el = document.getElementById(`n${i}_${t}`); const span = document.getElementById(`val_n${i}_${t}`); if (el) { el.value = n[t]; span.textContent = n[t].toFixed(2); } }); });
  outputWeights.forEach((w, j) => { const el = document.getElementById(`out_w${j}`); const span = document.getElementById(`val_out_w${j}`); if (el) { el.value = w; span.textContent = w.toFixed(2); } });
  const ob = document.getElementById('out_b'); const spanb = document.getElementById('val_out_b'); if (ob) { ob.value = outputBias; spanb.textContent = outputBias.toFixed(2); }
}
function handleParamInput(e) {
  const el = e.target; const type = el.dataset.type; const val = parseFloat(el.value);
  if (type === 'w1' || type === 'w2' || type === 'b') { const i = parseInt(el.dataset.i); neurons[i][type] = val; document.getElementById(`val_n${i}_${type}`).textContent = val.toFixed(2); }
  if (type === 'out_w') { const j = parseInt(el.dataset.j); outputWeights[j] = val; document.getElementById(`val_out_w${j}`).textContent = val.toFixed(2); }
  if (type === 'out_b') { outputBias = val; document.getElementById('val_out_b').textContent = val.toFixed(2); }
  updatePlaygroundMLP();
}

function updatePlaygroundMLP() {
  const mode = document.getElementById('play_mode').value;
  const xMin = -2, xMax = 6, yMin = -2, yMax = 6, nx = 100, ny = 100;
  const xs = numeric.linspace(xMin, xMax, nx), ys = numeric.linspace(yMin, yMax, ny);

  // Grid decision surface
  const Z = ys.map(yy => xs.map(xx => mlpOutput(xx, yy, mode)));
  const heat = {
    z: Z, x: xs, y: ys, type: 'heatmap',
    zmin: -1, zmax: 1,
    colorscale: (mode === 'binary') ? [['0', '#2b6cb0'], ['1', '#d53f3f']] : 'RdBu',
    showscale: (mode === 'continuous'), opacity: 0.85
  };

  // Training points
  const pts = {
    x: currentDataset.X.map(p => p[0]),
    y: currentDataset.X.map(p => p[1]),
    mode: 'markers', type: 'scatter',
    marker: { color: currentDataset.y.map(c => c === 1 ? '#d53f3f' : '#2b6cb0'), size: 10 }
  };

  // --- Hiperplanos de cada neurona ---
  const planes = [];
  neurons.forEach((n, i) => {
    if (Math.abs(n.w2) > 1e-6) {
      const x_vals = [xMin, xMax];
      const y_vals = x_vals.map(x => -(n.w1 * x + n.b) / n.w2);
      planes.push({
        x: x_vals, y: y_vals,
        mode: 'lines', type: 'scatter',
        line: { width: 2, dash: 'dot' },
        name: `Neurona ${i + 1}`
      });
    } else if (Math.abs(n.w1) > 1e-6) {
      // caso recta vertical
      const x_const = -n.b / n.w1;
      planes.push({
        x: [x_const, x_const], y: [yMin, yMax],
        mode: 'lines', type: 'scatter',
        line: { width: 2, dash: 'dot' },
        name: `Neurona ${i + 1}`
      });
    }
  });

  // Plot everything
  Plotly.react(
    'playground-plot',
    [heat, pts, ...planes],
    {
      margin: { t: 10 }, xaxis: { range: [xMin, xMax] }, yaxis: { range: [yMin, yMax] },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      showlegend: true
    },
    { displayModeBar: false }
  );

  // Update weights text
  let txt = '';
  neurons.forEach((n, i) => txt += `Neurona ${i + 1}: w=[${n.w1.toFixed(2)}, ${n.w2.toFixed(2)}], b=${n.b.toFixed(2)}\n`);
  txt += `Salida: w_out=[${outputWeights.map(w => w.toFixed(2)).join(', ')}], b_out=${outputBias.toFixed(2)}\n`;
  document.getElementById('weights_display').textContent = txt;
}

/* bindings */
document.getElementById('play_neurons').onchange = e => initPlayground(parseInt(e.target.value));
document.getElementById('play_mode').onchange = () => updatePlaygroundMLP();
document.getElementById('activation_mode').onchange = () => updatePlaygroundMLP();

/* datasets select si hay más de uno */
if (Object.keys(datasets).length > 1) {
  const row = document.getElementById('dataset_row'); row.style.display = 'block';
  const sel = document.getElementById('dataset_select');
  Object.keys(datasets).forEach(k => { const opt = document.createElement('option'); opt.value = k; opt.textContent = k; sel.appendChild(opt); });
  sel.onchange = e => { currentDataset = datasets[e.target.value]; updatePlaygroundMLP(); };
}

/* init */
initPlayground(2);
