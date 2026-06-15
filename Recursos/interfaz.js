window.metodoActual = 'FRANCES';
window.modoEntradaActual = 'TABLA';

document.addEventListener('DOMContentLoaded', () => {
    window.addRow();
    const res = document.getElementById('results');
    if(res) res.style.display = 'none';
});

window.setMetodo = function(metodo) {
    window.metodoActual = metodo;
    const btnF = document.getElementById('btn-frances');
    const btnA = document.getElementById('btn-americana');
    if(btnF && btnA) {
        if (metodo === 'FRANCES') {
            btnF.style.borderColor = 'var(--accent)'; btnF.style.color = 'var(--accent)';
            btnA.style.borderColor = 'var(--border)'; btnA.style.color = 'var(--text)';
        } else {
            btnA.style.borderColor = 'var(--accent)'; btnA.style.color = 'var(--accent)';
            btnF.style.borderColor = 'var(--border)'; btnF.style.color = 'var(--text)';
        }
    }
    // Si estamos en dibujo, redibuja inmediatamente al cambiar de método
    if (window.modoEntradaActual === 'GRAFO' && typeof window.renderizarPizarra === 'function') {
        window.renderizarPizarra();
    }
}

window.limpiar = function() {
    if(window.modoEntradaActual === 'TABLA') {
        document.getElementById('table-body').innerHTML = '';
        window.addRow();
    } else if (window.modoEntradaActual === 'MATRIZ') {
        if(typeof window.generarCuadriculaMatriz === 'function') window.generarCuadriculaMatriz();
    } else if (window.modoEntradaActual === 'GRAFO') {
        if(typeof window.limpiarLienzo === 'function') window.limpiarLienzo();
    }
    
    document.getElementById('results').style.display = 'none';
    const errorBox = document.getElementById('error-box');
    if(errorBox) { errorBox.innerText = ''; errorBox.style.display = 'none'; }
    
    if (window.modoEntradaActual === 'GRAFO') {
        document.getElementById('placeholder').style.display = 'none';
        document.getElementById('espacio-lienzo').style.display = 'block';
    } else {
        document.getElementById('espacio-lienzo').style.display = 'none';
        document.getElementById('placeholder').style.display = 'flex';
    }
}

window.addRow = function(act = '', dur = '', prec = '') {
    const tbody = document.getElementById('table-body');
    if(!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="act-name" value="${act}" placeholder="Ej. A" style="width: 90%; text-transform: uppercase; background: transparent; border: 1px solid var(--border); color: var(--text); padding: 5px;"></td>
        <td><input type="number" class="act-dur" value="${dur}" placeholder="Ej. 2" min="0" style="width: 90%; background: transparent; border: 1px solid var(--border); color: var(--text); padding: 5px;"></td>
        <td><input type="text" class="act-prec" value="${prec}" placeholder="Ej. A,B" style="width: 90%; text-transform: uppercase; background: transparent; border: 1px solid var(--border); color: var(--text); padding: 5px;"></td>
        <td><button class="btn btn-ghost" style="color: var(--critical); padding: 4px 8px; min-width: auto;" onclick="this.closest('tr').remove()">X</button></td>
    `;
    tbody.appendChild(tr);
}

window.loadExample = function() {
    document.getElementById('table-body').innerHTML = '';
    window.addRow('A', 1, ''); window.addRow('B', 2, ''); window.addRow('C', 2, 'A'); 
    window.addRow('D', 3, 'B'); window.addRow('E', 1, 'A'); window.addRow('F', 2, 'C,D,E');
}

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetTab = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    const targetContent = document.getElementById('tab-' + tabId);
    if(targetTab) targetTab.classList.add('active');
    if(targetContent) targetContent.classList.add('active');

    if (tabId === 'red' && window.ultimaRespuesta) {
        if (window.metodoActual === 'FRANCES' && typeof window.trazarConexionesAON === 'function') {
            setTimeout(() => window.trazarConexionesAON(window.ultimaRespuesta.red), 50);
        } else if (typeof window.trazarConexionesAOA === 'function') {
            setTimeout(() => window.trazarConexionesAOA(window.ultimaRespuesta.aristas_aoa), 50);
        }
    }
}

window.cambiarModoInput = function(modo) {
    window.modoEntradaActual = modo;
    const btnTabla = document.getElementById('btn-modo-tabla');
    const btnMatriz = document.getElementById('btn-modo-matriz');
    const btnGrafo = document.getElementById('btn-modo-grafo');
    
    [btnTabla, btnMatriz, btnGrafo].forEach(btn => {
        if(btn) { btn.style.borderColor = 'var(--border)'; btn.style.color = 'var(--text)'; }
    });

    const contTabla = document.getElementById('contenedor-tabla');
    const contMatriz = document.getElementById('contenedor-matriz');
    const contLienzo = document.getElementById('espacio-lienzo');
    const contPlaceholder = document.getElementById('placeholder');

    if(contTabla) contTabla.style.display = 'none';
    if(contMatriz) contMatriz.style.display = 'none';
    if(contLienzo) contLienzo.style.display = 'none';
    if(contPlaceholder) contPlaceholder.style.display = 'none';

    if (modo === 'TABLA') {
        if(btnTabla) { btnTabla.style.borderColor = 'var(--accent)'; btnTabla.style.color = 'var(--accent)'; }
        if(contTabla) contTabla.style.display = 'block';
        if(contPlaceholder) contPlaceholder.style.display = 'flex';
    } else if (modo === 'MATRIZ') {
        if(btnMatriz) { btnMatriz.style.borderColor = 'var(--accent)'; btnMatriz.style.color = 'var(--accent)'; }
        if(contMatriz) contMatriz.style.display = 'block';
        if(contPlaceholder) contPlaceholder.style.display = 'flex';
        if(typeof window.generarCuadriculaMatriz === 'function') window.generarCuadriculaMatriz();
    } else if (modo === 'GRAFO') {
        if(btnGrafo) { btnGrafo.style.borderColor = 'var(--accent)'; btnGrafo.style.color = 'var(--accent)'; }
        if(contLienzo) contLienzo.style.display = 'block';
        if(typeof window.setHerramienta === 'function') window.setHerramienta('NODO');
    }
}

window.generarCuadriculaMatriz = function() {
    const actInput = document.getElementById('matriz-actividades').value.trim().toUpperCase();
    if(!actInput) return;
    const actividades = actInput.split(',').map(a => a.trim()).filter(a => a !== '');
    const contenedor = document.getElementById('cuadricula-dinamica');
    if(!contenedor) return;
    let html = `<table style="border-collapse: collapse; text-align: center; font-family: var(--mono); font-size: 0.8rem;">`;
    html += `<tr><td style="padding: 5px; border: 1px solid var(--border); color: var(--accent); font-weight: bold;">X \\ Y</td>`;
    actividades.forEach(a => { html += `<td style="padding: 5px; border: 1px solid var(--border); font-weight: bold; width: 35px;">${a}</td>`; });
    html += `</tr>`;
    actividades.forEach((fila, i) => {
        html += `<tr><td style="padding: 5px; border: 1px solid var(--border); font-weight: bold; color: var(--muted);">${fila}</td>`;
        actividades.forEach((columna, j) => {
            html += `<td style="border: 1px solid var(--border); padding: 0;"><input type="text" class="matriz-celda" data-fila="${i}" data-col="${j}" value="0" readonly onclick="this.value = this.value === '0' ? '1' : '0'" style="width: 35px; height: 30px; text-align: center; background: transparent; border: none; color: var(--text); cursor: pointer; font-weight: bold; outline: none;"></td>`;
        });
        html += `</tr>`;
    });
    html += `</table>`;
    contenedor.innerHTML = html;
}