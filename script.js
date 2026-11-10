"use strict";

const $ = s => document.querySelector(s);
const TABS = [["map", "🗺️", "Mapa"], ["rep", "📸", "Reportar"], ["coe", "🚨", "COE"], ["ia", "🧠", "IA"]];

// Coordenadas centrales de Esmeraldas para el mapa Leaflet
const ESMERALDAS_CENTER = [0.9686, -79.6517];

// Zonas convertidas a formato GeoJSON (Polígonos 4326 listos para PostGIS)
const ZONES_PINS_GEOJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "id": 1, "n": "Las Palmas", "v": 0.9, "t": "Inundación / tsunami", "riskLevel": "Alto" },
      "geometry": { "type": "Point", "coordinates": [-79.7000, 0.9950] }
    },
    {
      "type": "Feature",
      "properties": { "id": 2, "n": "Isla Piedad", "v": 0.85, "t": "Desborde del río", "riskLevel": "Alto" },
      "geometry": { "type": "Point", "coordinates": [-79.6650, 0.9750] }
    },
    {
      "type": "Feature",
      "properties": { "id": 3, "n": "Barrio 5 de Agosto", "v": 0.7, "t": "Inundación pluvial", "riskLevel": "Medio" },
      "geometry": { "type": "Point", "coordinates": [-79.6450, 0.9550] }
    },
    {
      "type": "Feature",
      "properties": { "id": 4, "n": "Codesa", "v": 0.55, "t": "Deslizamiento", "riskLevel": "Medio" },
      "geometry": { "type": "Point", "coordinates": [-79.6250, 0.9350] }
    },
    {
      "type": "Feature",
      "properties": { "id": 5, "n": "Tachina (rural)", "v": 0.5, "t": "Vía y crecida rural", "riskLevel": "Bajo" },
      "geometry": { "type": "Point", "coordinates": [-79.6000, 0.9800] }
    }
  ]
};

let SH0 = [
    { id: 1, n: "Albergue Coliseo", lo: -79.652, la: 0.945, cap: 300, occ: 80 },
    { id: 2, n: "Albergue Unidad Educativa Norte", lo: -79.675, la: 0.99, cap: 150, occ: 120 },
    { id: 3, n: "Albergue Casa Comunal Tachina", lo: -79.605, la: 0.975, cap: 90, occ: 10 }
];

const AID0 = [
    { n: "Kits de agua", q: 420 },
    { n: "Raciones alimentarias", q: 900 },
    { n: "Colchonetas", q: 260 },
    { n: "Kits de higiene", q: 310 }
];

const HIST = [22, 31, 38, 34, 19, 9, 6, 5, 7, 10, 14, 20];
const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const TYPES = { inundacion: "Inundación", deslizamiento: "Deslizamiento", via: "Vía bloqueada", incendio: "Incendio", tsunami: "Alerta marina", otro: "Otro" };

let S = { 
    reports: [], 
    alerts: [], 
    shelters: SH0, 
    aid: AID0, 
    pick: null, 
    sim: false, 
    sc: { rain: 20, river: 1, tide: false },
    currentUser: null 
};

try {
    const j = localStorage.getItem("er_state");
    if (j) S = Object.assign(S, JSON.parse(j));
} catch (e) {}

const save = () => { try { localStorage.setItem("er_state", JSON.stringify(S)); } catch (e) {} };
const off = () => S.sim || !navigator.onLine;

let bc = null;
try { bc = new BroadcastChannel("er"); } catch (e) {}
if (bc) bc.onmessage = e => {
    if (e.data && e.data.alert) {
        S.alerts.unshift(e.data.alert);
        save();
        banner(e.data.alert);
        render();
    }
};
/* ---- Sincronización en Tiempo Real y WebSockets / Polling ---- */
let realTimeInterval = null;

function initRealTimeSync() {
    // Si ya está corriendo, no duplicar el intervalo
    if (realTimeInterval) return;

    realTimeInterval = setInterval(() => {
        // 1. En producción, aquí harías un fetch() a tu API de FastAPI:
        // fetch('http://localhost:8000/api/updates').then(res => res.json()).then(data => { ... });

        // 2. Para el prototipo funcional, revisamos si hay cambios locales o pendientes de sincronización
        if (!off()) {
            const pendingCount = S.reports.filter(r => !r.sync).length;
            if (pendingCount > 0) {
                flush(); // Sincroniza reportes pendientes automáticamente con el "servidor"
            }
        }

        // 3. Actualizar dinámicamente elementos de tiempo (como la hora de los reportes o estado de red)
        const netElement = $("#net");
        if (netElement) {
            const currentNetState = off() ? "● Sin conexión" : "● En línea";
            if (netElement.textContent !== currentNetState) {
                netElement.textContent = currentNetState;
                netElement.dataset.off = off() ? 1 : 0;
            }
        }

    }, 3000); // Revisa y sincroniza cada 3 segundos en segundo plano
}

// Escuchar cambios entre pestañas del navegador en tiempo real (BroadcastChannel)
let pepe = null;
try { 
    bc = new BroadcastChannel("er_realtime_channel"); 
} catch (e) {}

if (bc) {
    bc.onmessage = e => {
        if (e.data) {
            if (e.data.type === 'NEW_REPORT') {
                S.reports.unshift(e.data.report);
                save();
                render();
            } else if (e.data.type === 'NEW_ALERT') {
                S.alerts.unshift(e.data.alert);
                save();
                banner(e.data.alert);
                render();
            }
        }
    };
}

// Función para emitir eventos en tiempo real a otras pestañas o componentes
function broadcastEvent(type, payload) {
    if (bc) {
        bc.postMessage({ type: type, ...payload });
    }
}
function banner(a) {
    const b = $("#ban");
    b.style.display = "block";
    b.innerHTML = "<b>⚠ " + a.level + ":</b> " + esc(a.msg);
    try {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Esmeraldas Resiliente", { body: a.msg });
        }
    } catch (e) {}
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lvC = { Informativa: "#1565c0", Preventiva: "#f9a825", Alta: "#ef6c00", Evacuación: "#c62828" };
const rc = p => p >= 70 ? "#c62828" : p >= 40 ? "#ef6c00" : p >= 20 ? "#f9a825" : "#2e7d32";

/* ---- Lógica de IA y Riesgos ---- */
function zoneAt(lo, la) {
    let b = ZONES_GEOJSON.features[0].properties, d = 1e9;
    ZONES_GEOJSON.features.forEach(f => {
        // Cálculo aproximado basado en el centroide del feature
        const coords = f.geometry.coordinates[0];
        const cx = (coords[0][0] + coords[2][0]) / 2;
        const cy = (coords[0][1] + coords[2][1]) / 2;
        const k = (cx - lo) ** 2 + (cy - la) ** 2;
        if (k < d) { d = k; b = f.properties; }
    });
    return b;
}

function score(r) {
    const z = zoneAt(r.lo, r.la), h = (Date.now() - r.ts) / 36e5;
    
    // Mapear el nivel de amenaza a un valor numérico para la IA
    let threatWeight = 10; // Por defecto (bajo / amarillo)
    if (r.threat === 'medio' || r.threat === 'naranja') threatWeight = 25;
    if (r.threat === 'alto' || r.threat === 'rojo') threatWeight = 45;

    return Math.min(100, Math.round(threatWeight + z.v * 30 + Math.min(r.ppl, 50) / 50 * 20 + (h < 3 ? 10 : h < 12 ? 5 : 0) + (r.photo ? 5 : 0)));
}

function risk(prop, sc) {
    const x = (0.035 * sc.rain + 0.45 * sc.river + (sc.tide ? 0.7 : 0)) * (0.6 + prop.v) - 2.2;
    return Math.round(100 / (1 + Math.exp(-x)));
}

/* ---- Instancias y Capas de Leaflet ---- */
let mapInstance = null;
let geoJsonLayer = null;

function getSemaphoreColor(val) {
    return val >= 70 ? "#c62828" : val >= 40 ? "#ef6c00" : "#2e7d32";
}

/* ---- Mapa ---- */
function viewMap(customRisks) {
    if (mapInstance) {
        const infoText = $("#map-coords-info");
        if (infoText) {
            infoText.textContent = `Haz clic en el mapa para fijar la ubicación de un reporte${S.pick ? " · fijada: " + S.pick.la.toFixed(4) + ", " + S.pick.lo.toFixed(4) : ""}.`;
        }
        
        if (window.tempPickMarker) {
            mapInstance.removeLayer(window.tempPickMarker);
        }
        if (S.pick) {
            window.tempPickMarker = L.marker([S.pick.la, S.pick.lo], {
                icon: L.divIcon({ className: 'custom-pin', html: '📍', iconSize: [24, 24] })
            }).addTo(mapInstance);
        }
        return;
    }

    $("#p-map").innerHTML = `
        <div class="hero">
            <h2>¿Hay una emergencia?</h2>
            <p>Repórtala en segundos, incluso sin señal.</p>
            <div class="qa">
                <button class="sos" onclick="go('rep')">📸 Reportar ahora</button>
                <a href="tel:911">📞 911</a>
                <button onclick="go('coe')">🏠 Albergues</button>
            </div>
        </div>
        <div class="card">
            <h2>Mapa de riesgo (OpenStreetMap + PostGIS GeoJSON)</h2>
            <div id="leaflet-map" class="map"></div>
            <p class="mu" id="map-coords-info">Haz clic en el mapa para fijar la ubicación de un reporte${S.pick ? " · fijada: " + S.pick.la.toFixed(4) + ", " + S.pick.lo.toFixed(4) : ""}.</p>
        </div>
        
        <!-- APARTADO MOVIDO: Monitoreo Oficial (INAMHI y SNGR) -->
        <div class="card">
            <h2>Monitoreo Oficial (INAMHI y SNGR)</h2>
            <div class="item">
                <span class="tag" style="background:#1e88e5">INAMHI</span> <b>Advertencia Meteorológica N° 34 (Lluvias)</b>
                <div class="mu">Se pronostican precipitaciones de variable intensidad con tormentas eléctricas en la región Litoral, afectando de manera directa a la provincia de Esmeraldas. Vigente 48 horas.</div>
            </div>
            <div class="item">
                <span class="tag" style="background:#ef6c00">SNGR</span> <b>Estado de Alerta Naranja Activa</b>
                <div class="mu">Resolución institucional de monitoreo permanente por incremento del caudal en los ríos Esmeraldas y Teaone. Se recomienda activar los protocolos preventivos en zonas bajas.</div>
            </div>
        </div>

        <div class="card">
            <h3>Zonas vulnerables analizadas</h3>
            ${ZONES_GEOJSON.features.map((f, i) => {
                const rVal = customRisks ? customRisks[i] : Math.round(f.properties.v * 100);
                return `<div class="item"><b>${f.properties.n}</b> <span class="mu">· ${f.properties.t}</span><div class="bar"><i style="width:${rVal}%;background:${rc(rVal)}"></i></div></div>`;
            }).join("")}
        </div>`;

    mapInstance = L.map('leaflet-map').setView(ESMERALDAS_CENTER, 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    geoJsonLayer = L.geoJSON(ZONES_GEOJSON, {
        style: function (feature) {
            const index = ZONES_GEOJSON.features.indexOf(feature);
            const riskVal = customRisks ? customRisks[index] : Math.round(feature.properties.v * 100);
            const color = getSemaphoreColor(riskVal);
            return { color: color, weight: 2, fillColor: color, fillOpacity: 0.4 };
        },
        onEachFeature: function (feature, layer) {
            const index = ZONES_GEOJSON.features.indexOf(feature);
            const riskVal = customRisks ? customRisks[index] : Math.round(feature.properties.v * 100);
            layer.bindPopup(`<b>${feature.properties.n}</b><br>Tipo: ${feature.properties.t}<br>Riesgo: <b>${riskVal}%</b>`);
        }
    }).addTo(mapInstance);

    const blueShelterIcon = L.divIcon({
        className: 'custom-shelter-icon',
        html: '<div style="background-color: #1e88e5; color: white; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size: 14px;">🏠</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });

    S.shelters.forEach(a => {
        L.marker([a.la, a.lo], { icon: blueShelterIcon }).addTo(mapInstance).bindPopup(`🏠 <b>${a.n}</b><br>Capacidad: ${a.occ}/${a.cap}`);
    });

    S.reports.forEach(r => {
        L.circleMarker([r.la, r.lo], {
            radius: 8, fillColor: rc(score(r)), color: "#fff", weight: 2, fillOpacity: 0.9
        }).addTo(mapInstance).bindPopup(`<b>Reporte:</b> ${TYPES[r.type]}<br>${esc(r.desc || "")}`);
    });

    if (S.pick) {
        window.tempPickMarker = L.marker([S.pick.la, S.pick.lo], {
            icon: L.divIcon({ className: 'custom-pin', html: '📍', iconSize: [24, 24] })
        }).addTo(mapInstance);
    }

    mapInstance.on('click', function(e) {
        S.pick = { lo: e.latlng.lng, la: e.latlng.lat };
        save();
        
        if (window.tempPickMarker) {
            mapInstance.removeLayer(window.tempPickMarker);
        }
        window.tempPickMarker = L.marker([S.pick.la, S.pick.lo], {
            icon: L.divIcon({ className: 'custom-pin', html: '📍', iconSize: [24, 24] })
        }).addTo(mapInstance);

        const infoText = $("#map-coords-info");
        if (infoText) {
            infoText.textContent = `Haz clic en el mapa para fijar la ubicación de un reporte · fijada: ${S.pick.la.toFixed(4)}, ${S.pick.lo.toFixed(4)}.`;
        }
    });
}
/* ---- Reportes ---- */
let photo2 = null;

/* ---- Reportes Ciudadanos con Nivel de Amenaza por Colores ---- */
let photo = null;

function viewRep() {
    const p = S.pick, pend = S.reports.filter(r => !r.sync).length;
    
    $("#p-rep").innerHTML = `
        <div class="report-card">
            <h2>🚨 Nuevo Reporte de Emergencia</h2>
            <div class="mu" style="margin-bottom: 14px;">
                ${off() ? "📡 <b>Modo sin conexión:</b> El reporte se guardará de forma segura en tu dispositivo y se sincronizará automáticamente al recuperar señal." : "🟢 <b>Con conexión:</b> Envío inmediato al centro de operaciones."}
            </div>
            
            <label>Tipo de Emergencia</label>
            <select id="rt">
                ${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
            </select>
            
            <div class="row">
                <div>
                    <label>Nivel de Amenaza</label>
                    <select id="r-threat" style="font-weight: 600;">
                        <option value="bajo">🟡 Bajo</option>
                        <option value="medio" selected>🟠 Medio</option>
                        <option value="alto">🔴 Alto</option>
                    </select>
                </div>
                <div>
                    <label>Personas Afectadas (Aprox.)</label>
                    <input id="rp" type="number" min="0" value="0">
                </div>
            </div>
            
            <label>Descripción de los Hechos</label>
            <textarea id="rd" rows="3" placeholder="Detalle brevemente qué está ocurriendo..."></textarea>
            
            <label>Ubicación del Incidente</label>
            <div class="row">
                <button class="b s" id="gps">📍 Usar mi GPS actual</button>
                <button class="b s" id="mp">🗺️ Seleccionar en Mapa</button>
            </div>
            <div class="mu" style="margin-top: 6px; font-weight: 600;" id="loc">
                ${p ? "📍 Coordenadas fijadas: " + p.la.toFixed(5) + ", " + p.lo.toFixed(5) : "⚠ Ninguna ubicación seleccionada"}
            </div>
            
            <label>Evidencia Fotográfica (Cámara o Archivo)</label>
            <div class="camera-upload-box">
                <div class="camera-icon-wrapper">📸</div>
                <div style="font-weight: 600; font-size: 14px; color: var(--tx);">Toca para abrir la cámara o elegir una foto</div>
                <div class="mu">Compatible con captura directa en móviles</div>
                <input id="ph" type="file" accept="image/*" capture="environment">
            </div>
            <div id="pv"></div>
            
            <p style="margin-top: 20px;">
                <button class="b" id="send" style="width: 100%; font-size: 16px; padding: 14px;">🚀 Enviar Reporte Oficial</button>
            </p>
        </div>

        <div class="report-card">
            <h2>Mis Reportes Registrados <span class="mu">(${pend} pendientes de envío)</span></h2>
            ${S.reports.length ? S.reports.slice().reverse().map(r => {
                // Definir color de etiqueta según la amenaza guardada
                const threatColor = r.threat === 'alto' || r.threat === 'rojo' ? '#c62828' : r.threat === 'medio' || r.threat === 'naranja' ? '#ef6c00' : '#f9a825';
                const threatText = r.threat ? r.threat.toUpperCase() : 'MEDIO';
                
                return `
                <div class="report-history-item">
                    ${r.photo ? `<img class="report-preview-img" src="${r.photo}" alt="Evidencia">` : '<div style="width:80px; height:80px; background:var(--ac); border-radius:12px; display:grid; place-items:center; font-size:24px;">📝</div>'}
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <b style="font-size: 15px;">${TYPES[r.type]}</b>
                            <div style="display: flex; gap: 6px; align-items: center;">
                                <span class="tag" style="background:${threatColor}">Amenaza: ${threatText}</span>
                                <span class="tag" style="background:${r.sync ? "#2e7d32" : "#ef6c00"}">${r.sync ? "Sincronizado" : "Pendiente"}</span>
                            </div>
                        </div>
                        <div class="mu" style="margin-top: 2px;">${esc(r.desc || "Sin descripción")}</div>
                        <div class="mu" style="font-size: 11px; margin-top: 4px;">🕒 ${new Date(r.ts).toLocaleString()}</div>
                    </div>
                </div>
            `;}).join("") : '<div class="mu" style="text-align: center; padding: 20px;">Aún no has registrado ningún reporte en este dispositivo.</div>'}
        </div>`;

    // Eventos interactivos del módulo
    $("#gps").onclick = () => {
        if (!navigator.geolocation) return alert("El GPS no está disponible en este navegador.");
        navigator.geolocation.getCurrentPosition(g => {
            S.pick = { lo: g.coords.longitude, la: g.coords.latitude };
            save();
            viewRep();
        }, () => alert("No se pudo obtener la ubicación GPS. Por favor elígela directamente en el mapa."), { enableHighAccuracy: true, timeout: 8000 });
    };

    $("#mp").onclick = () => go("map");

    $("#ph").onchange = e => {
        const f = e.target.files[0];
        if (!f) return;
        const im = new Image();
        im.onload = () => {
            const c = document.createElement("canvas"), k = Math.min(1, 640 / im.width);
            c.width = im.width * k; c.height = im.height * k;
            c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
            photo = c.toDataURL("image/jpeg", .7);
            $("#pv").innerHTML = `
                <div class="preview-container">
                    <img class="report-preview-img" src="${photo}" alt="Vista previa">
                    <span class="mu" style="color: var(--pr); font-weight: 600;">✓ Foto cargada correctamente con la cámara</span>
                </div>`;
        };
        im.src = URL.createObjectURL(f);
    };

    $("#send").onclick = () => {
        if (!S.pick) return alert("Por favor fija una ubicación en el mapa o usa tu GPS antes de enviar el reporte.");
        
        const newReport = {
            id: Date.now(),
            type: $("#rt").value,
            threat: $("#r-threat").value, // Guardar la amenaza seleccionada (bajo, medio, alto)
            ppl: +$("#rp").value || 0,
            desc: $("#rd").value,
            lo: S.pick.lo,
            la: S.pick.la,
            photo: photo,
            ts: Date.now(),
            sync: false
        };

        S.reports.push(newReport);
        photo = null; 
        save(); 
        
        broadcastEvent('NEW_REPORT', { report: newReport });
        
        flush(); 
        viewRep();
        alert("¡Reporte registrado con éxito!");
    };
}
let busy = false;
function flush() {
    if (off() || busy) return;
    const q = S.reports.filter(r => !r.sync);
    if (!q.length) return;
    busy = true;
    setTimeout(() => { q.forEach(r => r.sync = true); busy = false; save(); render(); }, 900);
}

/* ---- COE ---- */
/* ---- COE ---- */
/* ---- COE ---- */
function viewCoe() {
    const rs = S.reports.map(r => Object.assign({}, r, { sc: score(r) })).sort((a, b) => b.sc - a.sc);
    const cap = S.shelters.reduce((a, s) => a + s.cap, 0), oc = S.shelters.reduce((a, s) => a + s.occ, 0);
    
    $("#p-coe").innerHTML = `
        <div class="kpi">
            <div><b>${S.reports.length}</b>reportes</div>
            <div><b>${rs.filter(r => r.sc >= 70).length}</b>críticos</div>
            <div><b>${cap - oc}</b>cupos libres</div>
        </div>
        <div style="height:12px"></div>
        
        <div class="grid">
            <div class="card">
                <h2>Emitir alerta</h2>
                <select id="al"><option>Informativa</option><option>Preventiva</option><option>Alta</option><option>Evacuación</option></select>
                <label>Mensaje</label><textarea id="am" rows="2" placeholder="Ej.: Evacuar Isla Piedad hacia Albergue Coliseo"></textarea>
                <p><button class="b d" id="ab">Difundir alerta</button> <button class="b s" id="nt">Activar notificaciones</button></p>
                ${S.alerts.length ? S.alerts.slice(0, 4).map(a => `<div class="item"><span class="tag" style="background:${lvC[a.level]}">${a.level}</span> ${esc(a.msg)}<div class="mu">${new Date(a.ts).toLocaleString()}</div></div>`).join("") : ""}
            </div>
            
            <div class="card">
                <h2>Incidentes priorizados (IA)</h2>
                ${rs.length ? rs.slice(0, 6).map(r => `<div class="item"><span class="tag" style="background:${rc(r.sc)}">${r.sc}</span> <b>${TYPES[r.type]}</b> · ${zoneAt(r.lo, r.la).n}<div class="mu">${esc(r.desc || "")} · ${r.ppl} personas</div></div>`).join("") : '<div class="mu">Sin incidentes.</div>'}
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2>Albergues <span class="mu">${oc}/${cap}</span></h2>
                ${S.shelters.map(s => { 
                    const p = Math.round(s.occ / s.cap * 100); 
                    return `<div class="item"><b>${s.n}</b> <span class="mu">${s.occ}/${s.cap}</span><div class="bar"><i style="width:${p}%;background:${rc(p)}"></i></div><div class="row" style="margin-top:6px"><button class="b s" data-s="${s.id}" data-d="-10">−10</button><button class="b s" data-s="${s.id}" data-d="10">+10</button></div></div>`; 
                }).join("")}
            </div>
            <div class="card">
                <h2>Ayuda humanitaria</h2>
                ${S.aid.map((a, i) => `<div class="item row" style="flex-wrap:nowrap"><span style="flex:2">${a.n}</span><b>${a.q}</b><button class="b s" data-a="${i}">Despachar 50</button></div>`).join("")}
            </div>
        </div>`;

    $("#ab").onclick = () => {
        const m = $("#am").value.trim();
        if (!m) return;
        const alertObj = { level: $("#al").value, msg: m, ts: Date.now() };
        
        S.alerts.unshift(alertObj); 
        save();
        
        broadcastEvent('NEW_ALERT', { alert: alertObj });
        
        banner(alertObj); 
        viewCoe();
    };
    $("#nt").onclick = () => { try { Notification.requestPermission(); } catch (e) { alert("Notificaciones no disponibles"); } };
    document.querySelectorAll("[data-s]").forEach(b => b.onclick = () => {
        const s = S.shelters.find(x => x.id == b.dataset.s);
        s.occ = Math.max(0, Math.min(s.cap, s.occ + +b.dataset.d));
        save(); viewCoe();
    });
    document.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
        const a = S.aid[+b.dataset.a];
        a.q = Math.max(0, a.q - 50);
        save(); viewCoe();
    });
}
/* ---- IA y Escenarios de Riesgo ---- */
/* ---- IA y Análisis Predictivo con Descarga de Informe ---- */
function viewIA() {
    const sc = S.sc;
    const rk = ZONES_GEOJSON.features.map(f => risk(f.properties, sc));
    const mx = Math.max(...HIST);
    
    // Obtener incidentes priorizados automáticamente
    const prioritizedReports = S.reports.map(r => Object.assign({}, r, { sc: score(r) })).sort((a, b) => b.sc - a.sc);

    $("#p-ia").innerHTML = `
        <div class="report-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap;">
                <div>
                    <h2>🧠 Inteligencia Artificial y Análisis Predictivo</h2>
                    <div class="mu" style="margin-bottom: 14px;">
                        Módulo analítico integrado con modelos heurísticos para la identificación de patrones, clasificación de incidentes y gestión preventiva de riesgos en Esmeraldas.
                    </div>
                </div>
                <!-- BOTÓN DE DESCARGA -->
                <button class="b" id="btn-download-ia-report" style="display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; font-size: 14px; padding: 10px 16px;">
                    📥 Descargar Reporte (.md)
                </button>
            </div>

            <!-- 1. Análisis de registros históricos y tendencias -->
            <div class="card" style="background: var(--bg); margin-bottom: 14px;">
                <h3 style="margin-top:0;">📊 Análisis de Registros Históricos y Tendencias</h3>
                <div class="mu" style="margin-bottom: 8px;">Frecuencia histórica de eventos adversos por mes (Serie temporal de recurrencia):</div>
                <svg viewBox="0 0 360 120" style="width:100%; height: auto;">
                    ${HIST.map((v, i) => `
                        <rect x="${i * 30 + 6}" y="${100 - v / mx * 85}" width="22" height="${v / mx * 85}" rx="3" fill="${v > 25 ? "var(--rd)" : "var(--pr)"}"/>
                        <text x="${i * 30 + 17}" y="114" font-size="9" text-anchor="middle" fill="var(--mu)">${MES[i]}</text>
                    `).join("")}
                </svg>
                <div class="mu" style="margin-top: 6px;">
                    <b>Patrón temporal detectado:</b> Pico estacional concentrado entre febrero y abril (época invernal). Se recomienda preposicionar recursos y limpiar drenajes pluviales antes de enero.
                </div>
            </div>

            <!-- 2. Identificación de sectores con recurrencia y patrones geográficos -->
            <div class="card" style="background: var(--bg); margin-bottom: 14px;">
                <h3 style="margin-top:0;">🗺️ Identificación de Sectores con Recurrencia (Inundaciones)</h3>
                <div class="mu" style="margin-bottom: 8px;">Sectores geográficos identificados con alta vulnerabilidad histórica a desbordes e inundaciones:</div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${ZONES_GEOJSON.features.map((f, i) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--br);">
                            <div>
                                <b>${f.properties.n}</b> <span class="mu">· ${f.properties.t}</span>
                            </div>
                            <span class="tag" style="background: ${rc(rk[i])}">Riesgo actual: ${rk[i]}%</span>
                        </div>
                    `).join("")}
                </div>
            </div>

            <!-- 3. Clasificación y priorización automática de incidentes -->
            <div class="card" style="background: var(--bg); margin-bottom: 14px;">
                <h3 style="margin-top:0;">⚡ Clasificación y Priorización Automática de Incidentes</h3>
                <div class="mu" style="margin-bottom: 8px;">Los reportes ciudadanos se clasifican y ponderan en tiempo real según gravedad, población afectada y tiempo transcurrido:</div>
                ${prioritizedReports.length ? prioritizedReports.slice(0, 4).map(r => `
                    <div class="item" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span class="tag" style="background: ${rc(r.sc)}">Score IA: ${r.sc}</span>
                            <b>${TYPES[r.type]}</b> · ${zoneAt(r.lo, r.la).n}
                            <div class="mu">${esc(r.desc || "Sin descripción")} · 👥 ${r.ppl} personas afectadas</div>
                        </div>
                    </div>
                `).join("") : '<div class="mu">No hay incidentes registrados para clasificar.</div>'}
            </div>

            <!-- 4. Estimación de escenarios de riesgo mediante modelos analíticos -->
            <div class="card" style="background: var(--bg);">
                <h3 style="margin-top:0;">🔮 Estimación de Escenarios de Riesgo (Simulador Analítico)</h3>
                <div class="mu" style="margin-bottom: 12px;">Modifica las variables ambientales para simular el comportamiento del riesgo en las zonas de estudio:</div>
                
                <label>Intensidad de Lluvia: <span id="lbl-rain" style="color: var(--pr); font-weight:700;">${sc.rain} mm/h</span></label>
                <input type="range" id="r1" min="0" max="100" value="${sc.rain}" style="margin-bottom: 10px;">
                
                <label>Nivel del Río: <span id="lbl-river" style="color: var(--pr); font-weight:700;">+${sc.river} m</span></label>
                <input type="range" id="r2" min="0" max="6" step=".5" value="${sc.river}" style="margin-bottom: 10px;">
                
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-top: 8px;">
                    <input style="width: auto;" type="checkbox" id="r3" ${sc.tide ? "checked" : ""}> 
                    <span>Condición de Marea Alta (Efecto estuarino)</span>
                </label>

                <div style="margin-top: 14px; padding: 12px; border-radius: 12px; background: var(--card); border: 1px solid var(--br);">
                    <b>Recomendación del Modelo Predictivo:</b>
                    <div class="mu" style="margin-top: 4px; font-size: 13.5px; color: var(--tx);">
                        ${Math.max(...rk) >= 70 ? "🔴 <b>Alerta Roja:</b> Se estiman desbordes críticos. Se recomienda emitir alerta de evacuación preventiva en zonas con riesgo ≥70%." : Math.max(...rk) >= 40 ? "🟠 <b>Alerta Naranja:</b> Incremento notable de vulnerabilidad. Mantener vigilancia constante en cauces de ríos." : "🟢 <b>Condición Estable:</b> Niveles de riesgo bajo control analítico."}
                    </div>
                </div>
            </div>
        </div>`;

    // Listeners del simulador
    $("#r1").oninput = e => { S.sc.rain = +e.target.value; save(); viewIA(); };
    $("#r2").oninput = e => { S.sc.river = +e.target.value; save(); viewIA(); };
    $("#r3").onchange = e => { S.sc.tide = e.target.checked; save(); viewIA(); };

    // Evento para generar y descargar el reporte técnico en Markdown (.md)
    $("#btn-download-ia-report").onclick = () => {
        downloadIAReport(sc, rk, prioritizedReports);
    };
}
/* ---- Función para generar y descargar el reporte de IA ---- */
function downloadIAReport(sc, rk, prioritizedReports) {
    const maxRisk = Math.max(...rk);
    const dateStr = new Date().toLocaleString("es-EC");

    let reportMD = `# ESMERALDAS RESILIENTE - INFORME ANALÍTICO DE IA Y RIESGOS
**Fecha de generación:** ${dateStr}
**Generado por:** ${S.currentUser ? S.currentUser : "Sistema COE - Prototipo"}

---

## 1. PARÁMETROS DEL ESCENARIO SIMULADO
- **Intensidad de Precipitación:** ${sc.rain} mm/h
- **Crecida del Nivel del Río:** +${sc.river} m
- **Condición Estuarina (Marea Alta):** ${sc.tide ? "Sí (Activa)" : "No (Normal)"}

---

## 2. NIVEL DE RIESGO PREDICTIVO POR SECTORES
`;

    ZONES_GEOJSON.features.forEach((f, i) => {
        reportMD += `- **${f.properties.n}** (${f.properties.t}): **${rk[i]}%** de riesgo estimado\n`;
    });

    reportMD += `\n---

## 3. EVALUACIÓN DE LA IA Y RECOMENDACIÓN OPERATIVA
**Diagnóstico:** ${maxRisk >= 70 ? "CRÍTICO - Alerta Roja" : maxRisk >= 40 ? "MODERADO - Alerta Naranja" : "ESTABLE - Alerta Verde"}
**Recomendación:** ${maxRisk >= 70 ? "Emitir alerta de evacuación inmediata en zonas con riesgo ≥70% y habilitar albergues temporales." : maxRisk >= 40 ? "Activar protocolo preventivo de monitoreo en cauces de ríos y alistar kits humanitarios." : "Mantener monitoreo pasivo mediante red sensorizada."}

---

## 4. CLASIFICACIÓN DE INCIDENTES CIUDADANOS PRIORIZADOS (TOP 5)
`;

    if (prioritizedReports.length > 0) {
        prioritizedReports.slice(0, 5).forEach((r, idx) => {
            reportMD += `${idx + 1}. **Score IA: ${r.sc}** | Tipo: ${TYPES[r.type]} | Zona: ${zoneAt(r.lo, r.la).n} | Afec: ${r.ppl} personas\n   *Descripción:* ${r.desc || "Sin detalle"}\n`;
        });
    } else {
        reportMD += `No hay incidentes reportados registrados actualmente.\n`;
    }

    reportMD += `\n---\n*Informe generado automáticamente por el motor heurístico de Esmeraldas Resiliente PWA.*`;

    // Crear un Blob y disparar la descarga directa
    const blob = new Blob([reportMD], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Informe_IA_Esmeraldas_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
/* ---- App Core ---- */
let cur = "map";
const V = { map: () => viewMap(), rep: viewRep, coe: viewCoe, ia: viewIA };

function go(t) { cur = t; render(); }

function render() {
    $("#nav").innerHTML = TABS.map(([k, i, n]) => `<button data-t="${k}" class="${k == cur ? "on" : ""}"><span>${i}</span>${n}</button>`).join("");
    document.querySelectorAll("#nav button").forEach(b => b.onclick = () => go(b.dataset.t));
    document.querySelectorAll(".pan").forEach(p => p.classList.toggle("on", p.id == "p-" + cur));
    V[cur]();
    const n = $("#net");
    n.textContent = off() ? "● Sin conexión" : "● En línea";
    n.dataset.off = off() ? 1 : 0;
}

$("#net").onclick = () => { S.sim = !S.sim; save(); flush(); render(); };
addEventListener("online", () => { flush(); render(); });
addEventListener("offline", render);

if (S.reports.length === 0) {
    const t = Date.now();
    S.reports = [
        { id: 1, type: "inundacion", sev: 5, ppl: 40, desc: "Agua en viviendas, Isla Piedad", lo: -79.665, la: 0.973, ts: t - 36e5, sync: true },
        { id: 2, type: "deslizamiento", sev: 3, ppl: 6, desc: "Talud inestable en Codesa", lo: -79.625, la: 0.937, ts: t - 9e6, sync: true }
    ];
}

render();
flush();
initRealTimeSync();