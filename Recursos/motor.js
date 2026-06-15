window.trazarConexionesAON = function(red) {
    const svg = document.getElementById('svg-flechas'); const wrapper = document.getElementById('red-wrapper'); if (!svg || !wrapper) return;
    let defs = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" /></marker><marker id="arrow-critica" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--critical)" /></marker></defs>`;
    let svgHTML = defs; const offsetRect = wrapper.getBoundingClientRect();
    for (const act in red) {
        const nodoFin = document.getElementById(`nodo-${act}`); if (!nodoFin) continue;
        const rectFin = nodoFin.getBoundingClientRect(); const endX = rectFin.left - offsetRect.left - 5; const endY = rectFin.top - offsetRect.top + (rectFin.height / 2);
        red[act].prec.forEach(p => {
            const nodoInicio = document.getElementById(`nodo-${p}`); if (!nodoInicio) return;
            const rectInicio = nodoInicio.getBoundingClientRect(); const startX = rectInicio.right - offsetRect.left + 5; const startY = rectInicio.top - offsetRect.top + (rectInicio.height / 2);
            const esCritica = red[act].HT === 0 && red[p] && red[p].HT === 0;
            const color = esCritica ? 'var(--critical)' : 'var(--muted)'; const marker = esCritica ? 'url(#arrow-critica)' : 'url(#arrow)';
            const controlX = startX + (endX - startX) / 2;
            svgHTML += `<path d="M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}" stroke="${color}" stroke-width="${esCritica ? '3' : '1.5'}" fill="none" marker-end="${marker}" />`;
        });
    }
    svg.innerHTML = svgHTML;
}

window.trazarConexionesAOA = function(aristas) {
    const svg = document.getElementById('svg-flechas'); const wrapper = document.getElementById('red-wrapper'); if (!svg || !wrapper) return;
    let defs = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" /></marker><marker id="arrow-critica" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--critical)" /></marker><marker id="arrow-ficticia" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" /></marker></defs>`;
    let svgHTML = defs; const offsetRect = wrapper.getBoundingClientRect();
    aristas.forEach(ar => {
        const nI = document.getElementById(`evento-${ar.origen}`); const nF = document.getElementById(`evento-${ar.destino}`); if (!nI || !nF) return;
        const rI = nI.getBoundingClientRect(); const rF = nF.getBoundingClientRect();
        const startX = rI.left + (rI.width / 2) - offsetRect.left; const startY = rI.top + (rI.height / 2) - offsetRect.top;
        const endX = rF.left + (rF.width / 2) - offsetRect.left; const endY = rF.top + (rF.height / 2) - offsetRect.top;
        const esCritica = ar.HT === 0 && !ar.es_ficticia;
        const color = esCritica ? 'var(--critical)' : (ar.es_ficticia ? 'var(--accent)' : 'var(--muted)');
        const marker = esCritica ? 'url(#arrow-critica)' : (ar.es_ficticia ? 'url(#arrow-ficticia)' : 'url(#arrow)');
        const dash = ar.es_ficticia ? 'stroke-dasharray="6,4"' : '';
        const dx = endX - startX; const dy = endY - startY; const dist = Math.sqrt(dx*dx + dy*dy);
        const sX = startX + (dx/dist)*42.5; const sY = startY + (dy/dist)*42.5; const eX = endX - (dx/dist)*47.5; const eY = endY - (dy/dist)*47.5;
        svgHTML += `<path d="M ${sX} ${sY} L ${eX} ${eY}" stroke="${color}" stroke-width="${esCritica ? '3' : '2'}" fill="none" marker-end="${marker}" ${dash} />`;
        let ang = Math.atan2(eY - sY, eX - sX) * 180 / Math.PI; if (ang > 90 || ang < -90) ang += 180; 
        let midX = sX + (eX - sX)*0.5; let midY = sY + (eY - sY)*0.5 - 12; 
        let text = ar.es_ficticia ? `${ar.nombre}` : `${ar.nombre} (${ar.dur})`;
        svgHTML += `<text x="${midX}" y="${midY}" fill="${color}" font-size="1.3rem" font-family="var(--mono)" font-weight="bold" text-anchor="middle" transform="rotate(${ang}, ${midX}, ${midY})" style="text-shadow: 0 3px 6px rgba(0,0,0,1);">${text}</text>`;
    });
    svg.innerHTML = svgHTML;
}

window.calculate = function() {
    let actividades = [];
    const errorBox = document.getElementById('error-box');
    if(errorBox) { errorBox.innerText = ''; errorBox.style.display = 'none'; }

    let urlFetch = '/calcular?metodo=' + window.metodoActual;
    let bodyData = null;

    if (window.modoEntradaActual === 'TABLA') {
        const rows = document.querySelectorAll('#table-body tr');
        for (let row of rows) {
            const act = row.querySelector('.act-name').value.trim().toUpperCase(); const dur = parseInt(row.querySelector('.act-dur').value); const precStr = row.querySelector('.act-prec').value.trim().toUpperCase();
            if (!act && isNaN(dur) && precStr === "") continue;
            if (!act || isNaN(dur) || dur < 0) { errorBox.innerText = "Error: Datos inválidos en tabla."; errorBox.style.display = 'block'; return; }
            const prec = precStr === "" ? [] : precStr.split(',').map(p => p.trim()).filter(p => p !== "");
            actividades.push({ act, dur, prec });
        }
        if (actividades.length === 0) return; bodyData = JSON.stringify(actividades);

    } else if (window.modoEntradaActual === 'MATRIZ') {
        const actInput = document.getElementById('matriz-actividades').value.trim().toUpperCase(); const durInput = document.getElementById('matriz-duraciones').value.trim();
        if(!actInput || !durInput) { errorBox.innerText = "Error: Campos de matriz incompletos."; errorBox.style.display = 'block'; return; }
        const acts = actInput.split(',').map(a => a.trim()).filter(a => a !== ''); const durs = durInput.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
        if(acts.length !== durs.length) { errorBox.innerText = "Error: Desajuste entre actividades y duraciones."; errorBox.style.display = 'block'; return; }
        let matrizBinaria = [];
        for(let i=0; i<acts.length; i++) {
            matrizBinaria[i] = [];
            for(let j=0; j<acts.length; j++) {
                let celda = document.querySelector(`.matriz-celda[data-fila="${i}"][data-col="${j}"]`); matrizBinaria[i][j] = celda ? parseInt(celda.value) : 0;
            }
        }
        urlFetch = '/calcular_matriz?metodo=' + window.metodoActual; bodyData = JSON.stringify({ actividades: acts, duraciones: durs, matriz: matrizBinaria });

    } else if (window.modoEntradaActual === 'GRAFO') {
        if(typeof window.extraerActividadesDesdeGrafo !== 'function') { errorBox.innerText = "Error de Módulo."; errorBox.style.display = 'block'; return; }
        actividades = window.extraerActividadesDesdeGrafo();
        if (!actividades || actividades.length === 0) { errorBox.innerText = "El lienzo está vacío. Define los nodos."; errorBox.style.display = 'block'; return; }
        urlFetch = '/calcular?metodo=' + window.metodoActual; bodyData = JSON.stringify(actividades);
    }

    const placeholder = document.getElementById('placeholder'); const results = document.getElementById('results'); const calcBtn = document.getElementById('calc-btn'); const loader = document.getElementById('loader');
    if(placeholder) placeholder.style.display = 'none'; if(results) results.style.display = 'none'; if(calcBtn) calcBtn.style.display = 'none'; if(loader) loader.style.display = 'flex';

    fetch(urlFetch, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: bodyData })
    .then(res => res.json())
    .then(data => {
        if(calcBtn) calcBtn.style.display = 'block'; if(loader) loader.style.display = 'none'; if(results) results.style.display = 'block';
        window.ultimaRespuesta = data;
        document.getElementById('critical-path-display').innerHTML = `<span style="color: var(--critical); font-weight: bold;">${data.ruta_critica}</span> <span style="color: var(--muted); margin-left: 10px;">(Tiempo de Sistema: ${data.tiempo_total})</span>`;

        let tablaHTML = `<table style="width: 100%; border-collapse: collapse; text-align: center; color: var(--text); font-size: 0.95rem;"><thead style="background: var(--surface); border-bottom: 2px solid var(--border);"><tr><th style="padding: 12px; border: 1px solid var(--border);">ACT</th><th style="padding: 12px; border: 1px solid var(--border); color: var(--muted);">DUR</th><th style="padding: 12px; border: 1px solid var(--border);">EO</th><th style="padding: 12px; border: 1px solid var(--border);">EF</th><th style="padding: 12px; border: 1px solid var(--border);">LO</th><th style="padding: 12px; border: 1px solid var(--border);">LF</th><th style="padding: 12px; border: 1px solid var(--border); color: var(--critical);">HT</th><th style="padding: 12px; border: 1px solid var(--border);">HL</th><th style="padding: 12px; border: 1px solid var(--border);">HNL</th></tr></thead><tbody>`;
        for (const [act, vals] of Object.entries(data.red)) {
            let esC = vals.HT === 0 ? "background: rgba(217, 93, 57, 0.08);" : ""; let clr = vals.HT === 0 ? 'var(--critical)' : 'inherit';
            tablaHTML += `<tr style="${esC}"><td style="padding: 10px; border: 1px solid var(--border); font-weight: bold; color: ${clr};">${act}</td><td style="padding: 10px; border: 1px solid var(--border); color: var(--muted);">${vals.dur}</td><td style="padding: 10px; border: 1px solid var(--border);">${vals.EO}</td><td style="padding: 10px; border: 1px solid var(--border);">${vals.EF}</td><td style="padding: 10px; border: 1px solid var(--border);">${vals.LO}</td><td style="padding: 10px; border: 1px solid var(--border);">${vals.LF}</td><td style="padding: 10px; border: 1px solid var(--border); font-weight: bold; color: ${clr};">${vals.HT}</td><td style="padding: 10px; border: 1px solid var(--border);">${vals.HL}</td><td style="padding: 10px; border: 1px solid var(--border);">${vals.HNL}</td></tr>`;
        }
        tablaHTML += `</tbody></table>`; document.getElementById('tab-tabla').innerHTML = tablaHTML;

        let redHTML = `<div style="width: 100%; max-height: 75vh; overflow: auto; background: rgba(0,0,0,0.1); border-radius: 8px; display: block;"><div id="red-wrapper" style="position: relative; display: flex; flex-direction: row; gap: 120px; padding: 80px 60px; justify-content: flex-start; align-items: center; min-width: 100%; width: max-content; min-height: 600px;"><svg id="svg-flechas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: visible;"></svg>`;
        try {
            if (window.metodoActual === 'FRANCES') {
                let niveles = {}; let nivelesA = []; for (let a in data.red) niveles[a] = 0;
                let iter = true; let c = 0; let lim = Object.keys(data.red).length + 5;
                while(iter){
                    iter = false;
                    for (let a in data.red) {
                        let mx = -1; data.red[a].prec.forEach(p => { if (data.red[p] && niveles[p] > mx) mx = niveles[p]; });
                        if(mx + 1 > niveles[a]){ niveles[a] = mx + 1; iter = true; }
                    }
                    if(++c > lim) throw new Error("Dependencia Cíclica.");
                }
                for (let a in niveles) { let n = niveles[a]; if (!nivelesA[n]) nivelesA[n] = []; nivelesA[n].push(a); }
                nivelesA.forEach(col => {
                    redHTML += `<div style="display: flex; flex-direction: column; gap: 100px; justify-content: center; align-items: center; z-index: 1; flex: 1; min-width: 150px;">`;
                    col.forEach(act => {
                        let v = data.red[act]; let isC = v.HT === 0;
                        let brd = isC ? 'var(--critical)' : 'var(--muted)'; let txt = isC ? 'var(--critical)' : 'var(--text)';
                        let bg = isC ? 'rgba(217, 93, 57, 0.08)' : 'var(--surface)'; let shdw = isC ? '0 0 15px rgba(217, 93, 57, 0.25)' : '0 4px 8px rgba(0,0,0,0.4)';
                        redHTML += `<div id="nodo-${act}" style="display: flex; flex-direction: column; align-items: center; width: 110px; font-family: var(--mono); transition: transform 0.2s;"><div style="display: flex; justify-content: space-between; width: 100%; padding: 0 4px; margin-bottom: 8px; font-size: 1.2rem; color: var(--accent); font-weight: 600;"><span>${v.EO}</span><span>${v.EF}</span></div><div style="border: 2px solid ${brd}; background: ${bg}; border-radius: 8px; width: 100%; height: 75px; display: flex; justify-content: center; align-items: center; position: relative; box-shadow: ${shdw};"><span style="font-size: 2.2rem; font-weight: bold; color: ${txt};">${act}</span><span style="position: absolute; top: 4px; right: 8px; font-size: 1rem; font-weight: bold; color: ${txt};">${v.dur}</span></div><div style="display: flex; justify-content: space-between; width: 100%; padding: 0 4px; margin-top: 8px; font-size: 1.2rem; color: var(--accent2); font-weight: 600;"><span>${v.LO}</span><span>${v.LF}</span></div></div>`;
                    });
                    redHTML += `</div>`;
                });
            } else {
                let nivAOA = {}; for (let id in data.eventos_aoa) nivAOA[id] = 0;
                let iterAOA = true; let cAOA = 0; let limAOA = Object.keys(data.eventos_aoa).length * 2;
                while(iterAOA) {
                    iterAOA = false;
                    data.aristas_aoa.forEach(ar => {
                        let s = ar.es_ficticia ? 0 : 1; 
                        if (nivAOA[ar.origen] + s > nivAOA[ar.destino]) { nivAOA[ar.destino] = nivAOA[ar.origen] + s; iterAOA = true; }
                    });
                    if(++cAOA > limAOA) throw new Error("Dependencia Cíclica.");
                }
                let cols = {}; for (const [id, v] of Object.entries(data.eventos_aoa)) { let idx = nivAOA[id]; if (!cols[idx]) cols[idx] = []; cols[idx].push(id); }
                let nY = {}; let keys = Object.keys(cols).sort((a,b) => parseInt(a) - parseInt(b));
                keys.forEach(k => {
                    let cn = cols[k];
                    if (k == 0) { cn.sort((a,b) => parseInt(a) - parseInt(b)); } 
                    else {
                        cn.sort((a,b) => {
                            let iA = data.aristas_aoa.filter(ar => ar.destino == a && !ar.es_ficticia); let aYa = iA.reduce((s, ar) => s + (nY[ar.origen] || 0), 0) / (iA.length || 1);
                            let iB = data.aristas_aoa.filter(ar => ar.destino == b && !ar.es_ficticia); let aYb = iB.reduce((s, ar) => s + (nY[ar.origen] || 0), 0) / (iB.length || 1);
                            if (Math.abs(aYa - aYb) > 0.1) return aYa - aYb;
                            let aToB = data.aristas_aoa.find(ar => ar.origen == a && ar.destino == b && ar.es_ficticia); if (aToB) return -1; 
                            let bToA = data.aristas_aoa.find(ar => ar.origen == b && ar.destino == a && ar.es_ficticia); if (bToA) return 1;
                            let nA = iA[0] ? iA[0].nombre : ''; let nB = iB[0] ? iB[0].nombre : ''; return nB.localeCompare(nA); 
                        });
                    }
                    cn.forEach((nid, i) => { nY[nid] = i; });
                    redHTML += `<div style="display: flex; flex-direction: column; gap: 80px; justify-content: center; align-items: center; z-index: 1; flex: 1; min-width: 100px;">`;
                    cn.forEach(nid => {
                        let v = data.eventos_aoa[nid]; let isC = v.E === v.L;
                        let brd = isC ? 'var(--critical)' : 'var(--muted)'; let shdw = isC ? '0 0 15px rgba(217, 93, 57, 0.4)' : '0 4px 8px rgba(0,0,0,0.4)';
                        redHTML += `<div id="evento-${nid}" style="border: 2px solid ${brd}; background: var(--surface); border-radius: 50%; width: 85px; height: 85px; display: flex; flex-direction: column; position: relative; box-shadow: ${shdw}; overflow: hidden; font-family: var(--mono);"><div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; background: ${brd}; transform: translateX(-50%);"></div><div style="display: flex; flex: 1;"><div style="flex: 1; display: flex; align-items: center; justify-content: center;"><span style="color: var(--accent); font-weight: bold; font-size: 1.4rem;">${v.E}</span></div><div style="flex: 1; display: flex; align-items: center; justify-content: center;"><span style="color: var(--accent2); font-weight: bold; font-size: 1.4rem;">${v.L}</span></div></div></div>`;
                    });
                    redHTML += `</div>`;
                });
            }
        } catch (err) { throw err; }
        redHTML += `</div></div>`; document.getElementById('tab-red').innerHTML = redHTML;

        let pasosHTML = '<div style="text-align: left; padding: 20px; color: var(--text); font-family: var(--mono); font-size: 1rem;"><h3 style="color: var(--accent); margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 5px;">IDA (Sumas)</h3>';
        for (const [act, vals] of Object.entries(data.red)) { pasosHTML += `<div style="margin-bottom: 8px; background: var(--card); padding: 8px; border-radius: 4px; border-left: 3px solid var(--accent);"><strong>Tarea ${act}:</strong> Inicio (${vals.EO}) + Duracion (${vals.dur}) = Fin (${vals.EF})</div>`; }
        pasosHTML += '<h3 style="color: var(--critical); margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 5px;">VUELTA (Restas)</h3>';
        for (const act of Object.keys(data.red).reverse()) {
            let vals = data.red[act]; let extra = vals.HT === 0 ? '<span style="color: var(--critical); font-weight: bold; margin-left: 10px;">[Critica: 0 descanso]</span>' : `<span style="color: var(--accent); margin-left: 10px;">[Descanso: ${vals.HT}]</span>`;
            pasosHTML += `<div style="margin-bottom: 8px; background: var(--card); padding: 8px; border-radius: 4px; border-left: 3px solid var(--critical);"><strong>Tarea ${act}:</strong> Limite final (${vals.LF}) - Duracion (${vals.dur}) = Limite inicio (${vals.LO}) ${extra}</div>`;
        }
        pasosHTML += '</div>'; document.getElementById('tab-pasos').innerHTML = pasosHTML;

        let ganttHTML = `<div style="position: relative; width: 100%; padding: 20px 0; border-left: 2px solid var(--border); border-bottom: 2px solid var(--border);">`;
        for (const [act, vals] of Object.entries(data.red)) {
            let pL = (vals.EO / data.tiempo_total) * 100; let pW = (vals.dur / data.tiempo_total) * 100; let bgC = vals.HT === 0 ? 'var(--critical)' : 'var(--accent2)';
            ganttHTML += `<div style="display: flex; align-items: center; margin-bottom: 12px;"><div style="width: 30px; font-weight: bold; text-align: right; padding-right: 10px; color: var(--text);">${act}</div><div style="flex-grow: 1; position: relative; height: 26px; background: var(--card); border-radius: 4px;"><div style="position: absolute; left: ${pL}%; width: ${pW}%; height: 100%; background: ${bgC}; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--bg); font-size: 0.8rem; font-weight: bold;">${vals.dur}</div></div></div>`;
        }
        ganttHTML += `<div style="display: flex; justify-content: space-between; margin-left: 30px; padding-top: 5px; color: var(--muted); font-size: 0.8rem; font-family: var(--mono);">`;
        for(let i = 0; i <= data.tiempo_total; i++) if (i === 0 || i === data.tiempo_total || i % 2 === 0) ganttHTML += `<span>${i}</span>`;
        ganttHTML += `</div></div>`; document.getElementById('tab-gantt').innerHTML = ganttHTML;

        let informeHTML = `<div style="padding: 25px; line-height: 1.6; color: var(--text); max-width: 800px; margin: 0 auto; font-family: var(--font);"><h2 style="color: var(--accent); border-bottom: 2px solid var(--border); padding-bottom: 10px; margin-bottom: 20px;">INFORME DE SISTEMA DE GESTION Y CONTROL DE OPERACIONES</h2><h3 style="color: var(--accent2); margin-top: 25px; margin-bottom: 10px;">1. RESULTADOS</h3><div style="background: var(--card); padding: 15px; border-radius: 8px; border-left: 4px solid var(--critical); margin-bottom: 20px;"><p style="margin-bottom: 5px;"><strong>Ruta Critica identificada:</strong> <span style="color: var(--critical); font-family: var(--mono); font-weight: bold;">${data.ruta_critica}</span></p><p><strong>Duracion Total del proyecto:</strong> <span style="color: var(--accent); font-family: var(--mono); font-weight: bold;">${data.tiempo_total} unidades de tiempo</span></p></div><h3 style="color: var(--accent2); margin-top: 25px; margin-bottom: 10px;">2. CONCLUSIONES Y RECOMENDACIONES</h3><ul style="margin-bottom: 15px; padding-left: 20px; color: var(--muted);"><li style="margin-bottom: 10px;"><strong>Impacto de la ruta critica:</strong> Las actividades de esta ruta dictan la duracion total del sistema. Un fallo o retraso en esta linea impacta de forma directa y proporcional en el fin del proyecto. No existe margen logico para el error.</li><li style="margin-bottom: 10px;"><strong>Flexibilidad operativa:</strong> Las tareas que poseen holgura proporcionan margen de maniobra. Este tiempo permite redirigir esfuerzos temporales o absorber imprevistos menores sin alterar la fecha de entrega final.</li><li><strong>Directriz de supervision:</strong> El control de operaciones debe centrar su vigilancia sobre las tareas de la ruta critica (<span style="color: var(--critical);">${data.ruta_critica}</span>).</li></ul></div>`;
        document.getElementById('tab-informe').innerHTML = informeHTML;

        if (document.getElementById('tab-red').classList.contains('active')) {
            if (window.metodoActual === 'FRANCES') setTimeout(() => window.trazarConexionesAON(data.red), 100);
            else setTimeout(() => window.trazarConexionesAOA(data.aristas_aoa), 100);
        }

        if (window.modoEntradaActual === 'GRAFO') {
            if (window.metodoActual === 'FRANCES') {
                window.nodosLienzo.forEach(nodo => {
                    if (data.red[nodo.label]) {
                        nodo.es = data.red[nodo.label].EO; nodo.ef = data.red[nodo.label].EF; nodo.ls = data.red[nodo.label].LO; nodo.lf = data.red[nodo.label].LF;
                    }
                });
            } else if (window.metodoActual === 'AMERICANA') {
                window.nodosLienzo.forEach(nodo => {
                    if (data.eventos_aoa[nodo.label]) {
                        nodo.es = data.eventos_aoa[nodo.label].E; nodo.lf = data.eventos_aoa[nodo.label].L;
                    }
                });
            }
            if (typeof window.renderizarPizarra === 'function') { window.renderizarPizarra(data.ruta_critica); }
        }
    })
    .catch(err => {
        if(calcBtn) calcBtn.style.display = 'block'; 
        if(loader) loader.style.display = 'none';
        if(errorBox) { errorBox.innerText = "Error: Bucle infinito o dependencias incorrectas."; errorBox.style.display = 'block'; }
    });
}