window.nodosLienzo = [];
window.flechasLienzo = [];

window.renderizarPizarra = function() {
    const areaNodos = document.getElementById('lienzo-nodos');
    const areaSvg = document.getElementById('lienzo-svg');
    if(!areaNodos || !areaSvg) return;
    
    // --- 1. DIBUJAR NODOS ---
    areaNodos.innerHTML = window.nodosLienzo.map(n => {
        let isSel = window.estadoLienzo && window.estadoLienzo.seleccionado === n.id;
        
        if (window.metodoActual === 'FRANCES') {
            let borderColor = isSel ? 'var(--critical)' : 'var(--accent)';
            let bgColor = isSel ? 'rgba(255, 71, 87, 0.15)' : 'rgba(217, 93, 57, 0.1)';
            let shadow = isSel ? '0 0 20px rgba(255, 71, 87, 0.4)' : 'none';

            // Mapeo visual de variables ingresadas, si están vacías no muestra nada
            let vES = n.es !== '' ? n.es : '';
            let vEF = n.ef !== '' ? n.ef : '';
            let vLS = n.ls !== '' ? n.ls : '';
            let vLF = n.lf !== '' ? n.lf : '';

            return `<div onclick="window.clickEnNodo('${n.id}', event)" style="position: absolute; left: ${n.x - 65}px; top: ${n.y - 45}px; width: 130px; height: 90px; cursor: pointer; user-select: none; font-family: var(--mono); font-weight: bold;">
                
                <div style="position: absolute; top: 0; left: 0; color: var(--accent2); font-size: 0.9rem;">${vES}</div>
                <div style="position: absolute; top: 0; right: 0; color: var(--accent2); font-size: 0.9rem;">${vEF}</div>
                
                <div style="position: absolute; top: 20px; left: 15px; width: 100px; height: 50px; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 6px; box-shadow: ${shadow}; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                    <span style="font-size: 1.8rem; color: var(--accent);">${n.label}</span>
                    <span style="position: absolute; top: 2px; right: 4px; font-size: 0.8rem; color: var(--text);">${n.dur}</span>
                </div>

                <div style="position: absolute; bottom: 0; left: 0; color: var(--accent2); font-size: 0.9rem;">${vLS}</div>
                <div style="position: absolute; bottom: 0; right: 0; color: var(--accent2); font-size: 0.9rem;">${vLF}</div>
                
            </div>`;
        } else {
            let border = isSel ? '3px solid var(--critical)' : '2px solid var(--border)';
            return `<div onclick="window.clickEnNodo('${n.id}', event)" style="position: absolute; left: ${n.x - 30}px; top: ${n.y - 30}px; width: 60px; height: 60px; background: var(--surface); border: ${border}; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text); font-family: var(--mono); font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.5); user-select: none;">
                <span style="font-size: 1.2rem; color: var(--accent2);">${n.label}</span>
            </div>`;
        }
    }).join('');

    // --- 2. DIBUJAR FLECHAS ---
    let defs = `<defs><marker id="arrow-dibujo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" /></marker></defs>`;
    let svgHTML = defs;

    window.flechasLienzo.forEach(f => {
        let nO = window.nodosLienzo.find(n => n.id === f.origen);
        let nD = window.nodosLienzo.find(n => n.id === f.destino);
        if(!nO || !nD) return;

        let dx = nD.x - nO.x; let dy = nD.y - nO.y; let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 10) return;

        let sX, sY, eX, eY;
        if (window.metodoActual === 'FRANCES') {
            sX = nO.x + (dx/dist)*50; sY = nO.y + (dy/dist)*30; 
            eX = nD.x - (dx/dist)*55; eY = nD.y - (dy/dist)*35; 
        } else {
            sX = nO.x + (dx/dist)*30; sY = nO.y + (dy/dist)*30; 
            eX = nD.x - (dx/dist)*35; eY = nD.y - (dy/dist)*35; 
        }
        
        let stroke = f.ficticia ? 'var(--accent)' : 'var(--muted)';
        let dash = f.ficticia ? 'stroke-dasharray="6,4"' : '';
        svgHTML += `<path d="M ${sX} ${sY} L ${eX} ${eY}" stroke="${stroke}" stroke-width="2" fill="none" marker-end="url(#arrow-dibujo)" ${dash}/>`;
        
        if(f.label && window.metodoActual === 'AMERICANA') {
            let midX = sX + (eX - sX)*0.5; let midY = sY + (eY - sY)*0.5 - 12;
            let ang = Math.atan2(eY - sY, eX - sX) * 180 / Math.PI;
            if (ang > 90 || ang < -90) ang += 180;
            svgHTML += `<text x="${midX}" y="${midY}" fill="${stroke}" font-size="0.9rem" font-family="var(--mono)" font-weight="bold" text-anchor="middle" transform="rotate(${ang}, ${midX}, ${midY})">${f.label} (${f.dur})</text>`;
        }
    });
    areaSvg.innerHTML = svgHTML;
}

const originalSetMetodo = window.setMetodo;
window.setMetodo = function(metodo) {
    if(originalSetMetodo) originalSetMetodo(metodo); 
    if (window.modoEntradaActual === 'GRAFO') window.renderizarPizarra(); 
}