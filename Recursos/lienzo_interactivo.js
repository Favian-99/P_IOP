/* ========================================================
   MEMORIA OPERATIVA Y CONTROL DE ESTADO
======================================================== */
window.nodosLienzo = window.nodosLienzo || [];
window.flechasLienzo = window.flechasLienzo || [];
window.estadoLienzo = { herramienta: 'NODO', seleccionado: null, editando: null, temporalX: 0, temporalY: 0, dragging: null, dragMovido: false, offsetX: 0, offsetY: 0, nodoContextual: null, flechaTemp: null, nodoAEliminar: null };

window.setHerramienta = function(h) {
    window.estadoLienzo.herramienta = h;
    window.estadoLienzo.seleccionado = null;
    window.estadoLienzo.editando = null;
    window.cerrarInspector(); window.cerrarMenuContextual(); window.cerrarInspectorFlecha(); window.cerrarModalConfirmacion();
    const btnNodo = document.getElementById('herr-nodo'); const btnFlecha = document.getElementById('herr-flecha');
    if(btnNodo) { btnNodo.style.borderColor = h === 'NODO' ? 'var(--accent)' : 'var(--border)'; btnNodo.style.color = h === 'NODO' ? 'var(--accent)' : 'var(--text)'; }
    if(btnFlecha) { btnFlecha.style.borderColor = h === 'FLECHA' ? 'var(--accent)' : 'var(--border)'; btnFlecha.style.color = h === 'FLECHA' ? 'var(--accent)' : 'var(--text)'; }
    if(typeof window.renderizarPizarra === 'function') window.renderizarPizarra();
}

window.limpiarLienzo = function() {
    window.nodosLienzo = []; window.flechasLienzo = []; window.estadoLienzo.seleccionado = null; window.estadoLienzo.editando = null;
    window.cerrarInspector(); window.cerrarMenuContextual(); window.cerrarInspectorFlecha(); window.cerrarModalConfirmacion();
    window.setHerramienta('NODO');
    if(typeof window.renderizarPizarra === 'function') window.renderizarPizarra();
}

/* ========================================================
   MÓDULO DE INTERACCIÓN ESPACIAL (DRAG, EDIT & DELETE)
======================================================== */
window.abrirMenuContextual = function(id, e) {
    e.preventDefault(); e.stopPropagation();
    window.cerrarInspector(); window.cerrarInspectorFlecha(); window.cerrarModalConfirmacion();
    window.estadoLienzo.nodoContextual = id;
    const menu = document.getElementById('menu-contextual');
    if(!menu) return false;
    const rect = document.getElementById('espacio-lienzo').getBoundingClientRect();
    menu.style.left = (e.clientX - rect.left) + 'px'; menu.style.top = (e.clientY - rect.top) + 'px';
    menu.style.display = 'block'; return false;
}

window.cerrarMenuContextual = function() {
    const menu = document.getElementById('menu-contextual');
    if(menu) menu.style.display = 'none';
}

window.accionarMenu = function(accion) {
    const id = window.estadoLienzo.nodoContextual; if(!id) return;
    window.cerrarMenuContextual();
    if(accion === 'EDITAR') {
        const nodoTarget = window.nodosLienzo.find(n => n.id === id);
        if (nodoTarget) {
            window.estadoLienzo.editando = id; window.estadoLienzo.temporalX = nodoTarget.x; window.estadoLienzo.temporalY = nodoTarget.y;
            window.abrirInspector('EDITAR_NODO', nodoTarget);
        }
    } else if (accion === 'ELIMINAR') {
        window.estadoLienzo.nodoAEliminar = id;
        const modal = document.getElementById('modal-confirmacion');
        if(modal) modal.style.display = 'block';
    }
}

window.cerrarModalConfirmacion = function() {
    const modal = document.getElementById('modal-confirmacion');
    if(modal) modal.style.display = 'none';
    window.estadoLienzo.nodoAEliminar = null;
}

window.ejecutarEliminacion = function() {
    const id = window.estadoLienzo.nodoAEliminar;
    if(id) {
        window.nodosLienzo = window.nodosLienzo.filter(n => n.id !== id);
        window.flechasLienzo = window.flechasLienzo.filter(f => f.origen !== id && f.destino !== id);
        window.estadoLienzo.seleccionado = null;
        window.renderizarPizarra();
    }
    window.cerrarModalConfirmacion();
}

window.iniciarArrastre = function(id, e) {
    if (e.button !== 0) return; if (window.estadoLienzo.herramienta !== 'NODO') return;
    window.cerrarMenuContextual(); window.estadoLienzo.dragging = id; window.estadoLienzo.dragMovido = false;
    const nodo = window.nodosLienzo.find(n => n.id === id);
    if(nodo) {
        const rect = document.getElementById('espacio-lienzo').getBoundingClientRect();
        window.estadoLienzo.offsetX = (e.clientX - rect.left) - nodo.x; window.estadoLienzo.offsetY = (e.clientY - rect.top) - nodo.y;
    }
}

window.procesarArrastre = function(e) {
    if (!window.estadoLienzo.dragging) return;
    window.estadoLienzo.dragMovido = true;
    const nodo = window.nodosLienzo.find(n => n.id === window.estadoLienzo.dragging);
    if(!nodo) return;
    const rect = document.getElementById('espacio-lienzo').getBoundingClientRect();
    nodo.x = (e.clientX - rect.left) - window.estadoLienzo.offsetX; nodo.y = (e.clientY - rect.top) - window.estadoLienzo.offsetY;
    window.renderizarPizarra();
}

window.finalizarArrastre = function() { if (window.estadoLienzo.dragging) { setTimeout(() => { window.estadoLienzo.dragging = null; }, 50); } }

window.clicEnLienzo = function(e) {
    if(e.target.id === 'lienzo-nodos') {
        if (window.estadoLienzo.herramienta === 'NODO') {
            window.estadoLienzo.temporalX = e.offsetX; window.estadoLienzo.temporalY = e.offsetY;
            window.estadoLienzo.editando = null; window.abrirInspector('CREAR_NODO');
        } else if (window.estadoLienzo.herramienta === 'FLECHA') {
            window.estadoLienzo.seleccionado = null;
            window.cerrarInspectorFlecha();
            window.renderizarPizarra();
        }
    }
}

window.clickEnNodo = function(id, e) {
    e.stopPropagation(); 
    if (window.estadoLienzo.dragMovido) { window.estadoLienzo.dragMovido = false; return; }
    window.cerrarInspector(); window.cerrarMenuContextual(); window.cerrarInspectorFlecha(); window.cerrarModalConfirmacion();
    
    if(window.estadoLienzo.herramienta === 'FLECHA') {
        if(!window.estadoLienzo.seleccionado) {
            window.estadoLienzo.seleccionado = id; 
            window.renderizarPizarra();
        } else {
            if(window.estadoLienzo.seleccionado !== id) {
                let existeParalela = window.flechasLienzo.some(f => f.origen === window.estadoLienzo.seleccionado && f.destino === id);
                if(existeParalela && window.metodoActual === 'AMERICANA') {
                    alert("Violación Topológica: Dos eventos no pueden conectarse por más de una actividad directa. Usa un evento intermedio ficticio.");
                    window.estadoLienzo.seleccionado = null; window.renderizarPizarra(); return;
                }
                
                if(window.metodoActual === 'AMERICANA') {
                    window.estadoLienzo.flechaTemp = { origen: window.estadoLienzo.seleccionado, destino: id };
                    window.abrirInspectorFlecha(e.clientX, e.clientY);
                } else {
                    window.flechasLienzo.push({ origen: window.estadoLienzo.seleccionado, destino: id, label: "", dur: 0, ficticia: false });
                    window.estadoLienzo.seleccionado = null; window.renderizarPizarra();
                }
            } else {
                window.estadoLienzo.seleccionado = null; window.renderizarPizarra();
            }
        }
    } else if (window.estadoLienzo.herramienta === 'NODO') {
        const nodoTarget = window.nodosLienzo.find(n => n.id === id);
        if (nodoTarget) {
            window.estadoLienzo.editando = id; window.estadoLienzo.temporalX = nodoTarget.x; window.estadoLienzo.temporalY = nodoTarget.y;
            window.abrirInspector('EDITAR_NODO', nodoTarget);
        }
    }
}

/* ========================================================
   MÓDULOS DE INSPECCIÓN (NODOS Y FLECHAS)
======================================================== */
window.abrirInspector = function(modo, nodoData = null) {
    const insp = document.getElementById('inspector-flotante');
    if(!insp) return;

    const esAm = window.metodoActual === 'AMERICANA';
    document.getElementById('contenedor-ins-frances').style.display = esAm ? 'none' : 'block';
    document.getElementById('contenedor-ins-americano').style.display = esAm ? 'flex' : 'none';
    document.getElementById('inspector-titulo').innerText = esAm ? "EVENTO AMERICANO (PERT)" : (modo === 'EDITAR_NODO' ? "EDITAR ACTIVIDAD" : "NUEVA ACTIVIDAD (MPM)");

    if (esAm) {
        document.getElementById('ins-am-label').value = nodoData ? nodoData.label : '';
        document.getElementById('ins-am-es').value = nodoData ? (nodoData.es || '') : '';
        document.getElementById('ins-am-lf').value = nodoData ? (nodoData.lf || '') : '';
    } else {
        document.getElementById('ins-label').value = nodoData ? nodoData.label : '';
        document.getElementById('ins-dur').value = nodoData ? nodoData.dur : '';
        document.getElementById('ins-es').value = nodoData ? (nodoData.es || '') : '';
        document.getElementById('ins-ef').value = nodoData ? (nodoData.ef || '') : '';
        document.getElementById('ins-ls').value = nodoData ? (nodoData.ls || '') : '';
        document.getElementById('ins-lf').value = nodoData ? (nodoData.lf || '') : '';
    }

    const lienzoBox = document.getElementById('espacio-lienzo').getBoundingClientRect();
    insp.style.left = (lienzoBox.left + window.estadoLienzo.temporalX + 20) + 'px';
    insp.style.top = (lienzoBox.top + window.estadoLienzo.temporalY - 70) + 'px';
    
    window.estadoLienzo.editando = nodoData ? nodoData.id : null;
    insp.style.display = 'block';
    setTimeout(() => { if (esAm) document.getElementById('ins-am-label').focus(); else document.getElementById('ins-label').focus(); }, 50);
}

window.guardarCambiosInspector = function() {
    const esAm = window.metodoActual === 'AMERICANA';
    const label = document.getElementById(esAm ? 'ins-am-label' : 'ins-label').value.trim().toUpperCase();
    if(!label) { alert("Dato requerido: Actividad / Evento."); return; }

    const dur = esAm ? 0 : (parseInt(document.getElementById('ins-dur').value) || 0);
    const es = document.getElementById(esAm ? 'ins-am-es' : 'ins-es').value.trim();
    const lf = document.getElementById(esAm ? 'ins-am-lf' : 'ins-lf').value.trim();
    const ef = esAm ? '' : document.getElementById('ins-ef').value.trim();
    const ls = esAm ? '' : document.getElementById('ins-ls').value.trim();

    if (window.estadoLienzo.editando) {
        let nodo = window.nodosLienzo.find(n => n.id === window.estadoLienzo.editando);
        if (nodo) { nodo.label = label; nodo.dur = dur; nodo.es = es; nodo.ef = ef; nodo.ls = ls; nodo.lf = lf; }
    } else {
        window.nodosLienzo.push({ id: Date.now().toString(), x: window.estadoLienzo.temporalX, y: window.estadoLienzo.temporalY, label: label, dur: dur, es: es, ef: ef, ls: ls, lf: lf });
    }
    
    window.cerrarInspector(); window.renderizarPizarra();
}

window.cerrarInspector = function() {
    const insp = document.getElementById('inspector-flotante');
    if(insp) insp.style.display = 'none';
    window.estadoLienzo.editando = null;
}

window.abrirInspectorFlecha = function(clientX, clientY) {
    const insp = document.getElementById('inspector-flecha');
    if(!insp) return;
    document.getElementById('ins-flecha-label').value = '';
    document.getElementById('ins-flecha-dur').value = '0';
    document.getElementById('ins-flecha-fic').checked = false;
    
    const rect = document.getElementById('espacio-lienzo').getBoundingClientRect();
    insp.style.left = (clientX - rect.left + 15) + 'px';
    insp.style.top = (clientY - rect.top - 50) + 'px';
    insp.style.display = 'block';
    setTimeout(() => document.getElementById('ins-flecha-label').focus(), 50);
}

window.cerrarInspectorFlecha = function() {
    const insp = document.getElementById('inspector-flecha');
    if(insp) insp.style.display = 'none';
    window.estadoLienzo.flechaTemp = null;
}

window.guardarFlechaInspector = function() {
    if(!window.estadoLienzo.flechaTemp) return;
    let label = document.getElementById('ins-flecha-label').value.trim().toUpperCase();
    const dur = parseInt(document.getElementById('ins-flecha-dur').value) || 0;
    const fic = document.getElementById('ins-flecha-fic').checked;
    
    if (fic) {
        label = "e'"; 
    } else if (!label) {
        alert("Dato requerido: Nombre de la Actividad."); return;
    }
    
    window.flechasLienzo.push({ origen: window.estadoLienzo.flechaTemp.origen, destino: window.estadoLienzo.flechaTemp.destino, label: label, dur: fic ? 0 : dur, ficticia: fic });
    
    window.estadoLienzo.seleccionado = null; 
    window.cerrarInspectorFlecha();
    window.renderizarPizarra();
}

/* ========================================================
   MOTOR DE RENDERIZADO VISUAL
======================================================== */
window.renderizarPizarra = function(rutaCriticaStr = "") {
    const areaNodos = document.getElementById('lienzo-nodos'); const areaSvg = document.getElementById('lienzo-svg');
    if(!areaNodos || !areaSvg) return;

    let rutaSet = new Set();
    if (typeof rutaCriticaStr === 'string' && rutaCriticaStr !== "") { rutaSet = new Set(rutaCriticaStr.split(' → ')); }

    areaNodos.innerHTML = window.nodosLienzo.map(n => {
        let isSel = window.estadoLienzo && window.estadoLienzo.seleccionado === n.id;
        let isCrit = window.metodoActual === 'FRANCES' ? rutaSet.has(n.label) : false;
        
        if (window.metodoActual === 'AMERICANA' && n.es !== '' && n.es === n.lf) {
             isCrit = true; 
        }

        if (window.metodoActual === 'FRANCES') {
            let borderColor = isSel ? 'var(--accent)' : (isCrit ? 'var(--critical)' : 'var(--border)');
            let bgColor = isCrit ? 'rgba(217, 93, 57, 0.1)' : 'var(--surface)';
            let shadow = isCrit ? '0 0 15px rgba(217, 93, 57, 0.4)' : (isSel ? '0 0 10px var(--accent)' : 'none');
            let vES = n.es !== undefined && n.es !== '' ? n.es : ''; let vEF = n.ef !== undefined && n.ef !== '' ? n.ef : ''; let vLS = n.ls !== undefined && n.ls !== '' ? n.ls : ''; let vLF = n.lf !== undefined && n.lf !== '' ? n.lf : '';

            return `<div onmousedown="window.iniciarArrastre('${n.id}', event)" oncontextmenu="return window.abrirMenuContextual('${n.id}', event);" onclick="window.clickEnNodo('${n.id}', event)" style="position: absolute; left: ${n.x - 65}px; top: ${n.y - 45}px; width: 130px; height: 90px; cursor: move; user-select: none; font-family: var(--mono); font-weight: bold;">
                <div style="position: absolute; top: 0; left: 0; color: var(--accent2); font-size: 0.9rem;">${vES}</div><div style="position: absolute; top: 0; right: 0; color: var(--accent2); font-size: 0.9rem;">${vEF}</div>
                <div style="position: absolute; top: 20px; left: 15px; width: 100px; height: 50px; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 6px; box-shadow: ${shadow}; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                    <span style="font-size: 1.8rem; color: ${isCrit ? 'var(--critical)' : 'var(--accent)'};">${n.label}</span><span style="position: absolute; top: 2px; right: 4px; font-size: 0.8rem; color: var(--text);">${n.dur}</span>
                </div>
                <div style="position: absolute; bottom: 0; left: 0; color: var(--accent2); font-size: 0.9rem;">${vLS}</div><div style="position: absolute; bottom: 0; right: 0; color: var(--accent2); font-size: 0.9rem;">${vLF}</div>
            </div>`;
        } else {
            let borderColor = isSel ? 'var(--accent)' : (isCrit ? 'var(--critical)' : 'var(--border)');
            let shadow = isCrit ? '0 0 15px rgba(217, 93, 57, 0.4)' : (isSel ? '0 0 10px var(--accent)' : '0 4px 6px rgba(0,0,0,0.5)');
            let varE = n.es !== undefined && n.es !== '' ? n.es : '0'; 
            let varL = n.lf !== undefined && n.lf !== '' ? n.lf : '0';

            return `<div onmousedown="window.iniciarArrastre('${n.id}', event)" oncontextmenu="return window.abrirMenuContextual('${n.id}', event);" onclick="window.clickEnNodo('${n.id}', event)" style="position: absolute; left: ${n.x - 35}px; top: ${n.y - 35}px; width: 70px; height: 70px; cursor: move; user-select: none; font-family: var(--mono); font-weight: bold;">
                <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); color: var(--accent2); font-size: 0.9rem;">${n.label}</div>
                <div style="width: 100%; height: 100%; background: var(--surface); border: 2px solid ${borderColor}; border-radius: 50%; display: flex; overflow: hidden; box-shadow: ${shadow};">
                    <div style="flex: 1; border-right: 1px solid ${borderColor}; display: flex; align-items: center; justify-content: center; background: ${isCrit ? 'rgba(217, 93, 57, 0.1)' : 'transparent'};"><span style="font-size: 1.1rem; color: var(--accent);">${varE}</span></div>
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: ${isCrit ? 'rgba(217, 93, 57, 0.1)' : 'transparent'};"><span style="font-size: 1.1rem; color: var(--accent2);">${varL}</span></div>
                </div>
            </div>`;
        }
    }).join('');

    let defs = `<defs><marker id="arrow-dibujo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" /></marker><marker id="arrow-fic" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" /></marker><marker id="arrow-critica" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--critical)" /></marker></defs>`;
    let svgHTML = defs;

    window.flechasLienzo.forEach(f => {
        let nO = window.nodosLienzo.find(n => n.id === f.origen); let nD = window.nodosLienzo.find(n => n.id === f.destino);
        if(!nO || !nD) return;

        let dx = nD.x - nO.x; let dy = nD.y - nO.y; let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 10) return;

        let sX, sY, eX, eY;
        if (window.metodoActual === 'FRANCES') {
            sX = nO.x + (dx/dist)*50; sY = nO.y + (dy/dist)*30; eX = nD.x - (dx/dist)*55; eY = nD.y - (dy/dist)*35; 
        } else {
            sX = nO.x + (dx/dist)*35; sY = nO.y + (dy/dist)*35; eX = nD.x - (dx/dist)*40; eY = nD.y - (dy/dist)*40; 
        }
        
        let isCritFlecha = false;
        if (window.metodoActual === 'AMERICANA') {
            if (f.ficticia) {
                isCritFlecha = (nO.es !== '' && nO.es === nO.lf && nD.es !== '' && nD.es === nD.lf);
            } else {
                isCritFlecha = rutaSet.has(f.label);
            }
        }

        let stroke = isCritFlecha ? 'var(--critical)' : (f.ficticia ? 'var(--accent)' : 'var(--muted)');
        let dash = f.ficticia ? 'stroke-dasharray="6,4"' : '';
        let marker = isCritFlecha ? 'url(#arrow-critica)' : (f.ficticia ? 'url(#arrow-fic)' : 'url(#arrow-dibujo)');

        svgHTML += `<path d="M ${sX} ${sY} L ${eX} ${eY}" stroke="${stroke}" stroke-width="${isCritFlecha ? 3 : 2.5}" fill="none" marker-end="${marker}" ${dash}/>`;
        
        if(window.metodoActual === 'AMERICANA' && f.label) {
            let midX = sX + (eX - sX)*0.5; let midY = sY + (eY - sY)*0.5 - 10;
            let ang = Math.atan2(eY - sY, eX - sX) * 180 / Math.PI;
            if (ang > 90 || ang < -90) ang += 180;
            
            let textoDisplay = f.ficticia ? "e'" : `${f.label} (${f.dur})`;
            svgHTML += `<text x="${midX}" y="${midY}" fill="${stroke}" font-size="1rem" font-family="var(--mono)" font-weight="bold" text-anchor="middle" transform="rotate(${ang}, ${midX}, ${midY})">${textoDisplay}</text>`;
        }
    });
    areaSvg.innerHTML = svgHTML;
}

document.addEventListener('mousemove', window.procesarArrastre);
document.addEventListener('mouseup', window.finalizarArrastre);

/* ========================================================
   PUENTE DE EJECUCIÓN (CÁLCULO)
======================================================== */
window.procesarDibujo = function() {
    if(window.nodosLienzo.length === 0) { 
        alert("Error: El lienzo está vacío. Define los eventos/actividades primero."); 
        return; 
    }
    if(typeof window.calculate === 'function') {
        window.calculate();
    } else {
        alert("Error de sistema: Módulo de cálculo no encontrado.");
    }
}

/* ========================================================
   EXTRACCIÓN LÓGICA CON CORTAFUEGOS ANTI-BUCLES
======================================================== */
window.extraerActividadesDesdeGrafo = function() {
    const nodos = window.nodosLienzo; const flechas = window.flechasLienzo;
    let actividades = [];
    if (nodos.length === 0) return null;

    if (window.metodoActual === 'FRANCES') {
        nodos.forEach(nodo => {
            if(!nodo.label) return;
            let precedentes = [];
            flechas.forEach(f => {
                if (f.destino === nodo.id) {
                    let nO = nodos.find(n => n.id === f.origen);
                    if (nO && nO.label) precedentes.push(nO.label);
                }
            });
            actividades.push({ act: nodo.label, dur: nodo.dur, prec: precedentes });
        });
    } else {
        flechas.forEach(flecha => {
            if (flecha.ficticia || !flecha.label) return; 
            let precedentes = [];
            
            function rastrear(id_evento, visitados = new Set()) {
                if(visitados.has(id_evento)) return; 
                visitados.add(id_evento);
                
                flechas.forEach(f_in => {
                    if (f_in.destino === id_evento) {
                        if (!f_in.ficticia && f_in.label) precedentes.push(f_in.label);
                        else rastrear(f_in.origen, visitados);
                    }
                });
            }
            rastrear(flecha.origen);
            precedentes = [...new Set(precedentes)];
            actividades.push({ act: flecha.label, dur: flecha.dur, prec: precedentes });
        });
    }
    return actividades;
}