from flask import Flask, request, jsonify, render_template

app = Flask(__name__, template_folder='pantallas', static_folder='recursos')

@app.route('/')
def index():
    return render_template('index.html')

# FUNCION NUCLEO REUTILIZABLE PARA TABLAS Y MATRICES
def calcular_logica_nucleo(actividades, metodo):
    # --- MOTOR BASE AON (Universal para Tablas, Pasos y Gantt) ---
    red = {}
    for a in actividades:
        red[a["act"]] = {
            "dur": a["dur"], "prec": a["prec"],
            "EO": 0, "EF": 0, "LO": 0, "LF": 0, "HT": 0, "HL": 0, "HNL": 0
        }
        
    for act in red:
        if not red[act]["prec"]:
            red[act]["EO"] = 0
        else:
            red[act]["EO"] = max([red[p]["EF"] for p in red[act]["prec"] if p in red])
        red[act]["EF"] = red[act]["EO"] + red[act]["dur"]
        
    tiempo_final = max([red[a]["EF"] for a in red]) if red else 0
    
    for act in reversed(list(red.keys())):
        sucesores = [a for a in red if act in red[a]["prec"]]
        if not sucesores:
            red[act]["LF"] = tiempo_final
        else:
            red[act]["LF"] = min([red[s]["LO"] for s in sucesores])
        red[act]["LO"] = red[act]["LF"] - red[act]["dur"]
        
    ruta_critica = []
    for act in red:
        red[act]["HT"] = red[act]["LF"] - red[act]["EO"] - red[act]["dur"]
        red[act]["HL"] = red[act]["EF"] - red[act]["EO"] - red[act]["dur"]
        red[act]["HNL"] = red[act]["HT"] - red[act]["HL"]
        if red[act]["HT"] == 0:
            ruta_critica.append(act)

    if metodo == 'FRANCES':
        return jsonify({
            "red": red,
            "ruta_critica": " → ".join(ruta_critica),
            "tiempo_total": tiempo_final
        })

    elif metodo == 'AMERICANA':
        # --- MOTOR AOA (Especifico para Red Circular con Ficticias) ---
        node_id = 0
        act_nodes = {}
        aristas = []
        
        # 1. Asignacion de Nodos Finales
        for a in actividades:
            node_id += 1
            act_nodes[a["act"]] = {'start': None, 'end': node_id}
            
        # 2. Asignacion de Nodos Iniciales (Separacion de Inicios)
        for a in actividades:
            act = a["act"]
            precs = a["prec"]
            if not precs:
                node_id += 1
                act_nodes[act]['start'] = node_id
            else:
                main_prec = precs[0] 
                act_nodes[act]['start'] = act_nodes[main_prec]['end']
                
        # 3. Estructuracion de Aristas (Reales y Ficticias)
        for a in actividades:
            act = a["act"]
            precs = a["prec"]
            aristas.append({
                'nombre': act, 'dur': a["dur"],
                'origen': act_nodes[act]['start'], 'destino': act_nodes[act]['end'],
                'es_ficticia': False
            })
            if len(precs) > 1:
                for p in precs[1:]:
                    aristas.append({
                        'nombre': f"{p}'", 'dur': 0,
                        'origen': act_nodes[p]['end'], 'destino': act_nodes[act]['start'],
                        'es_ficticia': True
                    })
                    
        # 4. Calculo de Nodos (Eventos de Tiempo)
        nodos_ids = set()
        for ar in aristas:
            nodos_ids.add(ar['origen'])
            nodos_ids.add(ar['destino'])
            
        eventos = {n: {'E': 0, 'L': float('inf')} for n in nodos_ids}
        
        for _ in range(len(nodos_ids)):
            for ar in aristas:
                u, v, t = ar['origen'], ar['destino'], ar['dur']
                if eventos[u]['E'] + t > eventos[v]['E']:
                    eventos[v]['E'] = eventos[u]['E'] + t
                    
        t_total_aoa = max([e['E'] for e in eventos.values()]) if eventos else 0
        for n in eventos:
            eventos[n]['L'] = t_total_aoa
            
        for _ in range(len(nodos_ids)):
            for ar in aristas:
                u, v, t = ar['origen'], ar['destino'], ar['dur']
                if eventos[v]['L'] - t < eventos[u]['L']:
                    eventos[u]['L'] = eventos[v]['L'] - t
                    
        for ar in aristas:
            u, v, t = ar['origen'], ar['destino'], ar['dur']
            ar['HT'] = eventos[v]['L'] - eventos[u]['E'] - t

        return jsonify({
            "red": red, 
            "eventos_aoa": eventos,
            "aristas_aoa": aristas,
            "ruta_critica": " → ".join(ruta_critica),
            "tiempo_total": tiempo_final
        })


@app.route('/calcular', methods=['POST'])
def calcular():
    metodo = request.args.get('metodo', 'FRANCES')
    actividades = request.json
    return calcular_logica_nucleo(actividades, metodo)


@app.route('/calcular_matriz', methods=['POST'])
def calcular_matriz():
    metodo = request.args.get('metodo', 'FRANCES')
    datos = request.json
    nombres = datos["actividades"]   
    duraciones = datos["duraciones"] 
    matriz = datos["matriz"]         
    
    # TRADUCTOR DE MATRIZ A LISTA DE ACTIVIDADES CPM
    actividades_convertidas = []
    for j in range(len(nombres)):
        precedentes = []
        for i in range(len(nombres)):
            if int(matriz[i][j]) == 1:
                precedentes.append(nombres[i])
        
        actividades_convertidas.append({
            "act": nombres[j],
            "dur": int(duraciones[j]),
            "prec": precedentes
        })
        
    # Enviar las actividades traducidas al motor logico central
    return calcular_logica_nucleo(actividades_convertidas, metodo)


if __name__ == '__main__':
    app.run(debug=True)