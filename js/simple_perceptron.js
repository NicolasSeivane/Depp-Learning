    (function () {
      const tabButtons = document.getElementById('tabButtons');
      const tabContents = document.getElementById('tabContents');
      let first = true;
      for (const dname in datasets) {
        const btn = document.createElement('button');
        btn.className = 'tablinks';
        btn.textContent = dname.replace('Dataset', 'Dataset ');
        btn.onclick = (evt) => openDataset(evt, dname);
        tabButtons.appendChild(btn);

        const div = document.createElement('div');
        div.id = dname;
        div.className = 'tabcontent';
        div.innerHTML = `
      <h2>${dname.replace('Dataset', 'Dataset ')}</h2>
      <div class="controls">
        <label>Learning rate:
          <select id="lr_${dname}"></select>
        </label>
        <label>
          <input type="checkbox" id="sesgo_${dname}" checked> Usar sesgo
        </label>
        <label>
          ActualizaciÃ³n: <input type="range" id="slider_${dname}" min="0" value="0" step="1">
          <span id="iter_${dname}">0</span>
        </label>

        <label>Vector w:
          <select id="wmode_${dname}">
            <option value="normal">Normal a la recta</option>
            <option value="origen">Desde el origen</option>
          </select>
        </label>
        <button onclick="showBest('${dname}')">Mostrar Mejor Peso</button>
      </div>
      <div id="plot_${dname}" class="plot-container"></div>
      <div id="info_${dname}"></div>
    `;
        tabContents.appendChild(div);

        if (first) {
          btn.className += " active";
          div.style.display = "block";
          first = false;
        }
      }

      for (const dname in datasets) {
        const lrs = datasets[dname].con.length;
        const lrSelect = document.getElementById(`lr_${dname}`);
        ["0.1", "0.01", "0.001"].forEach((lr, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.textContent = lr;
          lrSelect.appendChild(opt);
        });
        lrSelect.onchange = () => updatePlot(dname);

        document.getElementById(`sesgo_${dname}`).onchange = () => updatePlot(dname);
        document.getElementById(`slider_${dname}`).oninput = function () {
          document.getElementById(`iter_${dname}`).textContent = this.value;
          updatePlot(dname);
        };
        document.getElementById(`wmode_${dname}`).onchange = () => updatePlot(dname);
      }

      window.openDataset = function (evt, datasetName) {
        let tabcontent = document.getElementsByClassName("tabcontent");
        for (let i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
        let tablinks = document.getElementsByClassName("tablinks");
        for (let i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
        document.getElementById(datasetName).style.display = "block";
        evt.currentTarget.className += " active";
        updatePlot(datasetName);
      };

      window.updatePlot = function (datasetName, showBestFlag = false) {
        const data = datasets[datasetName];
        const lrIdx = document.getElementById(`lr_${datasetName}`).value;
        const usarSesgo = document.getElementById(`sesgo_${datasetName}`).checked;
        const biasKey = usarSesgo ? "con" : "sin";
        const results = data[biasKey][lrIdx];

        const X = puntos[datasetName].X;
        const y = puntos[datasetName].y;

        const slider = document.getElementById(`slider_${datasetName}`);
        slider.max = results.pesos.length - 1;
        let iter = Math.min(parseInt(slider.value), results.pesos.length - 1);
        slider.value = iter;
        document.getElementById(`iter_${datasetName}`).textContent = iter;

        let traces = [];
        const puntosPos = X.filter((_, i) => y[i] === 1);
        const puntosNeg = X.filter((_, i) => y[i] === -1);

        traces.push({
          x: puntosPos.map(p => p[0]),
          y: puntosPos.map(p => p[1]),
          mode: "markers",
          marker: { color: "blue", size: 12, line: { width: 1, color: '#222' } },
          name: "Clase +1"
        });
        traces.push({
          x: puntosNeg.map(p => p[0]),
          y: puntosNeg.map(p => p[1]),
          mode: "markers",
          marker: { color: "red", size: 12, line: { width: 1, color: '#222' } },
          name: "Clase -1"
        });

        const w = results.pesos[iter];
        const b = results.sesgos[iter];
        const epoca = results.epocas[iter];
        const error = results.errores[iter];

        // Hiperplano largo: calcula intersecciÃ³n con los bordes del grÃ¡fico
        const xRange = [-2, 8];
        const yRange = [-2, 8];
        let hpPoints = [];

        // Si w[1] != 0, calcula para x en los extremos
        if (Math.abs(w[1]) > 1e-8) {
          let y1 = (-w[0] * xRange[0] - b) / w[1];
          let y2 = (-w[0] * xRange[1] - b) / w[1];
          hpPoints.push({ x: xRange[0], y: y1 });
          hpPoints.push({ x: xRange[1], y: y2 });
        }
        // Si w[0] != 0, calcula para y en los extremos
        if (Math.abs(w[0]) > 1e-8) {
          let x1 = (-w[1] * yRange[0] - b) / w[0];
          let x2 = (-w[1] * yRange[1] - b) / w[0];
          hpPoints.push({ x: x1, y: yRange[0] });
          hpPoints.push({ x: x2, y: yRange[1] });
        }
        // Filtra puntos dentro del rango visible
        hpPoints = hpPoints.filter(pt =>
          pt.x >= xRange[0] - 2 && pt.x <= xRange[1] + 2 && pt.y >= yRange[0] - 2 && pt.y <= yRange[1] + 2
        );
        // Elimina duplicados
        const unique = {};
        hpPoints.forEach(pt => unique[pt.x.toFixed(6) + '_' + pt.y.toFixed(6)] = pt);
        hpPoints = Object.values(unique);
        // Si hay mÃ¡s de 2 puntos, toma los extremos
        if (hpPoints.length > 2) {
          hpPoints.sort((a, b) => a.x - b.x);
          hpPoints = [hpPoints[0], hpPoints[hpPoints.length - 1]];
        }

        if (hpPoints.length === 2) {
          traces.push({
            x: [hpPoints[0].x, hpPoints[1].x],
            y: [hpPoints[0].y, hpPoints[1].y],
            mode: "lines",
            line: { color: "black", dash: "dash", width: 3 },
            name: "Hiperplano"
          });
        }

        // Dibuja el vector w desde el centro del hiperplano (no desde el centro del grÃ¡fico)
        // El vector w es ortogonal al hiperplano, asÃ­ que lo dibujamos desde el punto medio del hiperplano
        if (hpPoints.length === 2 && (Math.abs(w[0]) > 1e-8 || Math.abs(w[1]) > 1e-8)) {
          const w_norm = Math.sqrt(w[0] * w[0] + w[1] * w[1]);
          const scale = 2.5;
          // Selector de modo
          let wmode = "normal";
          const wmodeSel = document.getElementById(`wmode_${datasetName}`);
          if (wmodeSel) wmode = wmodeSel.value;
          let wx0, wy0;
          if (wmode === "origen") {
            wx0 = 0;
            wy0 = 0;
          } else {
            wx0 = (hpPoints[0].x + hpPoints[1].x) / 2;
            wy0 = (hpPoints[0].y + hpPoints[1].y) / 2;
          }
          traces.push({
            x: [wx0, wx0 + w[0] / w_norm * scale],
            y: [wy0, wy0 + w[1] / w_norm * scale],
            mode: "lines+markers",
            marker: { color: "#2d3a6b", size: 10 },
            line: { color: "#2d3a6b", width: 5 },
            name: "Vector w"
          });
        }

        if (showBestFlag) {
          const w_best = results.w_best;
          const b_best = results.b_best;
          let hpBest = [];
          if (Math.abs(w_best[1]) > 1e-8) {
            let y1 = (-w_best[0] * xRange[0] - b_best) / w_best[1];
            let y2 = (-w_best[0] * xRange[1] - b_best) / w_best[1];
            hpBest.push({ x: xRange[0], y: y1 });
            hpBest.push({ x: xRange[1], y: y2 });
          }
          if (Math.abs(w_best[0]) > 1e-8) {
            let x1 = (-w_best[1] * yRange[0] - b_best) / w_best[0];
            let x2 = (-w_best[1] * yRange[1] - b_best) / w_best[0];
            hpBest.push({ x: x1, y: yRange[0] });
            hpBest.push({ x: x2, y: yRange[1] });
          }
          hpBest = hpBest.filter(pt =>
            pt.x >= xRange[0] - 2 && pt.x <= xRange[1] + 2 && pt.y >= yRange[0] - 2 && pt.y <= yRange[1] + 2
          );
          const uniqBest = {};
          hpBest.forEach(pt => uniqBest[pt.x.toFixed(6) + '_' + pt.y.toFixed(6)] = pt);
          hpBest = Object.values(uniqBest);
          if (hpBest.length > 2) {
            hpBest.sort((a, b) => a.x - b.x);
            hpBest = [hpBest[0], hpBest[hpBest.length - 1]];
          }
          if (hpBest.length === 2) {
            traces.push({
              x: [hpBest[0].x, hpBest[1].x],
              y: [hpBest[0].y, hpBest[1].y],
              mode: "lines",
              line: { color: "orange", dash: "dot", width: 5 },
              name: "Hiperplano mejor w"
            });
          }
        }

        // Ejes X e Y
        traces.push({
          x: [xRange[0], xRange[1]],
          y: [0, 0],
          mode: "lines",
          line: { color: "#888", width: 2, dash: "dot" },
          name: "Eje X",
          hoverinfo: "skip",
          showlegend: false
        });
        traces.push({
          x: [0, 0],
          y: [yRange[0], yRange[1]],
          mode: "lines",
          line: { color: "#888", width: 2, dash: "dot" },
          name: "Eje Y",
          hoverinfo: "skip",
          showlegend: false
        });

        Plotly.newPlot(`plot_${datasetName}`, traces, {
          xaxis: {
            range: xRange,
            zeroline: false,
            gridcolor: '#dbe3fa',
            title: { text: "xâ‚", font: { size: 18, color: "#2d3a6b" } }
          },
          yaxis: {
            range: yRange,
            zeroline: false,
            gridcolor: '#dbe3fa',
            title: { text: "xâ‚‚", font: { size: 18, color: "#2d3a6b" } }
          },
          width: 700, height: 600,
          margin: { l: 60, r: 20, t: 40, b: 60 },
          plot_bgcolor: "#f7f9ff",
          paper_bgcolor: "#f7f9ff",
          title: { text: datasetName, font: { color: "#2d3a6b", size: 22 } },
          legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.13 }
        });

        // Mostrar informaciÃ³n y advertencia si no se logra error 0
        let infoHtml = `
      <b>Ã‰poca:</b> ${epoca}<br>
      <b>ActualizaciÃ³n:</b> ${iter}<br>
      <b>w:</b> [${w.map(v => v.toFixed(3))}]<br>
      <b>b:</b> ${b.toFixed(3)}<br>
      <b>FÃ³rmula:</b> ${w[0].toFixed(3)}*xâ‚ + ${w[1].toFixed(3)}*xâ‚‚ + ${b.toFixed(3)} = 0<br>
      <b>Error:</b> ${error}<br>
    `;
        if (results.error_best !== 0) {
          infoHtml += `<span style="color:red;"><b>Advertencia:</b> No se logrÃ³ separar perfectamente el dataset.<br>
      Mejor error alcanzado: <b>${results.error_best}</b></span>`;
        }
        document.getElementById(`info_${datasetName}`).innerHTML = infoHtml;
      };

      window.showBest = function (datasetName) {
        updatePlot(datasetName, true);
      };

      // Agrega botÃ³n de pestaÃ±a para el playground
      const playgroundBtn = document.createElement('button');
      playgroundBtn.className = 'tablinks';
      playgroundBtn.textContent = 'Jugar';
      playgroundBtn.onclick = (evt) => openPlayground(evt);
      tabButtons.appendChild(playgroundBtn);

      // FunciÃ³n para abrir la pestaÃ±a de juego
      function openPlayground(evt) {
        // Oculta todas las tabcontent
        let tabcontent = document.getElementsByClassName("tabcontent");
        for (let i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
        let tablinks = document.getElementsByClassName("tablinks");
        for (let i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
        document.getElementById("playgroundTab").style.display = "block";
        evt.currentTarget.className += " active";
        updatePlayground();
      }

      // Playground: muestra puntos de Dataset1 y permite mover w1, w2, b
      function updatePlayground() {
        const w1 = parseFloat(document.getElementById('play_w1').value);
        const w2 = parseFloat(document.getElementById('play_w2').value);
        const b = parseFloat(document.getElementById('play_b').value);
        document.getElementById('play_values').innerHTML =
          `<b>w:</b> [${w1.toFixed(2)}, ${w2.toFixed(2)}] <b>b:</b> ${b.toFixed(2)}`;

        // Usa los puntos de Dataset1
        const dataset = document.getElementById('play_dataset').value;
        const X = puntos[dataset].X;
        const y = puntos[dataset].y;
        const puntosPos = X.filter((_, i) => y[i] === 1);
        const puntosNeg = X.filter((_, i) => y[i] === -1);

        let traces = [
          {
            x: puntosPos.map(p => p[0]),
            y: puntosPos.map(p => p[1]),
            mode: "markers",
            marker: { color: "blue", size: 12, line: { width: 1, color: '#222' } },
            name: "Clase +1"
          },
          {
            x: puntosNeg.map(p => p[0]),
            y: puntosNeg.map(p => p[1]),
            mode: "markers",
            marker: { color: "red", size: 12, line: { width: 1, color: '#222' } },
            name: "Clase -1"
          }
        ];

        // Hiperplano largo
        const xRange = [-2, 8];
        const yRange = [-2, 8];
        let hpPoints = [];
        if (Math.abs(w2) > 1e-8) {
          let y1 = (-w1 * xRange[0] - b) / w2;
          let y2 = (-w1 * xRange[1] - b) / w2;
          hpPoints.push({ x: xRange[0], y: y1 });
          hpPoints.push({ x: xRange[1], y: y2 });
        }
        if (Math.abs(w1) > 1e-8) {
          let x1 = (-w2 * yRange[0] - b) / w1;
          let x2 = (-w2 * yRange[1] - b) / w1;
          hpPoints.push({ x: x1, y: yRange[0] });
          hpPoints.push({ x: x2, y: yRange[1] });
        }
        hpPoints = hpPoints.filter(pt =>
          pt.x >= xRange[0] - 2 && pt.x <= xRange[1] + 2 && pt.y >= yRange[0] - 2 && pt.y <= yRange[1] + 2
        );
        const unique = {};
        hpPoints.forEach(pt => unique[pt.x.toFixed(6) + '_' + pt.y.toFixed(6)] = pt);
        hpPoints = Object.values(unique);
        if (hpPoints.length > 2) {
          hpPoints.sort((a, b) => a.x - b.x);
          hpPoints = [hpPoints[0], hpPoints[hpPoints.length - 1]];
        }
        if (hpPoints.length === 2) {
          traces.push({
            x: [hpPoints[0].x, hpPoints[1].x],
            y: [hpPoints[0].y, hpPoints[1].y],
            mode: "lines",
            line: { color: "black", dash: "dash", width: 3 },
            name: "Hiperplano"
          });

          // Vector w: modo segÃºn selecciÃ³n
          const w_norm = Math.sqrt(w1 * w1 + w2 * w2);
          const scale = 2.5;
          const wmode = document.getElementById('play_wmode').value;
          let wx0, wy0;
          if (wmode === "origen") {
            wx0 = 0;
            wy0 = 0;
          } else {
            // normal a la recta: desde el punto medio del hiperplano
            wx0 = (hpPoints[0].x + hpPoints[1].x) / 2;
            wy0 = (hpPoints[0].y + hpPoints[1].y) / 2;
          }
          traces.push({
            x: [wx0, wx0 + w1 / w_norm * scale],
            y: [wy0, wy0 + w2 / w_norm * scale],
            mode: "lines+markers",
            marker: { color: "#2d3a6b", size: 10 },
            line: { color: "#2d3a6b", width: 5 },
            name: "Vector w"
          });
        }
        // Ejes X e Y
        traces.push({
          x: [xRange[0], xRange[1]],
          y: [0, 0],
          mode: "lines",
          line: { color: "#888", width: 2, dash: "dot" },
          name: "Eje X",
          hoverinfo: "skip",
          showlegend: false
        });
        traces.push({
          x: [0, 0],
          y: [yRange[0], yRange[1]],
          mode: "lines",
          line: { color: "#888", width: 2, dash: "dot" },
          name: "Eje Y",
          hoverinfo: "skip",
          showlegend: false
        });

        Plotly.newPlot("play_plot", traces, {
          xaxis: {
            range: xRange,
            zeroline: false,
            gridcolor: '#dbe3fa',
            title: { text: "xâ‚", font: { size: 18, color: "#2d3a6b" } }
          },
          yaxis: {
            range: yRange,
            zeroline: false,
            gridcolor: '#dbe3fa',
            title: { text: "xâ‚‚", font: { size: 18, color: "#2d3a6b" } }
          },
          width: 700, height: 600,
          margin: { l: 60, r: 20, t: 40, b: 60 },
          plot_bgcolor: "#f7f9ff",
          paper_bgcolor: "#f7f9ff",
          title: { text: "Jugar con el hiperplano", font: { color: "#2d3a6b", size: 22 } },
          legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.13 }
        });
      }

      // Listeners para sliders del playground
      ["play_w1", "play_w2", "play_b"].forEach(id => {
        document.getElementById(id).oninput = updatePlayground;
      });
      document.getElementById('play_dataset').onchange = updatePlayground;

      document.getElementById('play_wmode').onchange = updatePlayground;

      // Activa la primera pestaÃ±a por defecto
      document.getElementsByClassName("tablinks")[0].click();

    })(); // Cierra la funciÃ³n autoejecutable
