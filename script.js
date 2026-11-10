"use strict";

const $ = s => document.querySelector(s);

// Todos los módulos disponibles
const ALL_TABS = [
    ["map", "🗺️", "Mapa", ["usuario", "admin"]],
    ["rep", "📸", "Reportar", ["usuario", "admin"]],
    ["coe", "🚨", "COE", ["admin"]],
    ["ia", "🧠", "IA", ["admin"]]
];

// Usuarios predefinidos con roles
const USERS_DB = [
    { username: "usuario", pass: "1234", name: "Usuario Ciudadano", role: "usuario" },
    { username: "admin", pass: "admin123", name: "Administrador COE", role: "admin" }
];

// Coordenadas centrales de Esmeraldas para el mapa Leaflet
const ESMERALDAS_CENTER = [0.9686, -79.6517];

// Zonas GeoJSON
const ZONES_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "id": 1, "n": "Las Palmas", "v": 0.9, "t": "Inundación / tsunami", "riskLevel": "Alto" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-79.72, 1.01], [-79.68, 1.01], [-79.68, 0.98], [-79.72, 0.98], [-79.72, 1.01]]]
            }
        },
        {
            "type": "Feature",
            "properties": { "id": 2, "n": "Isla Piedad", "v": 0.85, "t": "Desborde del río", "riskLevel": "Alto" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-79.68, 0.99], [-79.65, 0.99], [-79.65, 0.96], [-79.68, 0.96], [-79.68, 0.99]]]
            }
        },
        {
            "type": "Feature",
            "properties": { "id": 3, "n": "Barrio 5 de Agosto", "v": 0.7, "t": "Inundación pluvial", "riskLevel": "Medio" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-79.66, 0.97], [-79.63, 0.97], [-79.63, 0.94], [-79.66, 0.94], [-79.66, 0.97]]]
            }
        },
        {
            "type": "Feature",
            "properties": { "id": 4, "n": "Codesa", "v": 0.55, "t": "Deslizamiento", "riskLevel": "Medio" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-79.64, 0.95], [-79.61, 0.95], [-79.61, 0.92], [-79.64, 0.92], [-79.64, 0.95]]]
            }
        },
        {
            "type": "Feature",
            "properties": { "id": 5, "n": "Tachina (rural)", "v": 0.5, "t": "Vía y crecida rural", "riskLevel": "Bajo" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-79.62, 1.00], [-79.58, 1.00], [-79.58, 0.96], [-79.62, 0.96], [-79.62, 1.00]]]
            }
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

/* ---- Lógica de Autenticación y Roles ---- */
/* ---- Lógica de Autenticación y Roles con Transiciones ---- */
/* ---- Autenticación y Control de Navegación Separada ---- */
function initAuth() {
    const loginScreen = $("#login-screen");
    const loginForm = $("#login-form");
    const loginError = $("#login-error");

    if (!S.currentUser) {
        // Si NO hay sesión activa: Mostrar pantalla de login y ocultar interfaz principal
        loginScreen.style.display = "grid";
        loginScreen.classList.remove("hidden");
        $("header").style.display = "none";
        $("main").style.display = "none";
        $("#nav").style.display = "none";
    } else {
        // Si SÍ hay sesión activa: Ocultar login y mostrar aplicación principal
        loginScreen.style.display = "none";
        loginScreen.classList.add("hidden");
        $("header").style.display = "flex";
        $("main").style.display = "block";
        $("#nav").style.display = "flex";
        renderUserInfo();
    }

    loginForm.onsubmit = (e) => {
        e.preventDefault();
        const userVal = $("#login-user").value.trim();
        const passVal = $("#login-pass").value.trim();

        const userFound = USERS_DB.find(u => u.username.toLowerCase() === userVal.toLowerCase() && u.pass === passVal);

        if (userFound) {
            S.currentUser = userFound;
            save();
            loginError.style.display = "none";
            
            // Transición suave de salida
            loginScreen.classList.add("hidden");
            
            setTimeout(() => {
                loginScreen.style.display = "none";
                $("header").style.display = "flex";
                $("main").style.display = "block";
                $("#nav").style.display = "flex";
                
                cur = "map";
                renderUserInfo();
                render();
                
                // Forzar renderizado correcto del mapa de Leaflet tras mostrar la app
                if (mapInstance) {
                    mapInstance.invalidateSize();
                }
            }, 400);

        } else {
            loginError.textContent = "Credenciales incorrectas. Verifica usuario y contraseña.";
            loginError.style.display = "block";
        }
    };
}

function logout() {
    S.currentUser = null;
    save();
    
    $("#login-user").value = "";
    $("#login-pass").value = "";
    
    // Ocultar app y mostrar pantalla de autenticación
    $("header").style.display = "none";
    $("main").style.display = "none";
    $("#nav").style.display = "none";
    
    const loginScreen = $("#login-screen");
    loginScreen.style.display = "grid";
    setTimeout(() => {
        loginScreen.classList.remove("hidden");
    }, 10);
}

function renderUserInfo() {
    const container = $("#user-info-container");
    if (S.currentUser && container) {
        container.innerHTML = `
            <div class="user-badge">
                <span>👤 ${esc(S.currentUser.name)} (${S.currentUser.role.toUpperCase()})</span>
                <button id="logout-btn" title="Cerrar sesión">🚪 Cerrar sesión</button>
            </div>
        `;
        $("#logout-btn").onclick = logout;
    }
}

/* ---- Comunicación en tiempo real ---- */
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

let realTimeInterval = null;
function initRealTimeSync() {
    if (realTimeInterval) return;
    realTimeInterval = setInterval(() => {
        if (!off()) {
            const pendingCount = S.reports.filter(r => !r.sync).length;
            if (pendingCount > 0) flush();
        }
        const netElement = $("#net");
        if (netElement) {
            const currentNetState = off() ? "● Sin conexión" : "● En línea";
            if (netElement.textContent !== currentNetState) {
                netElement.textContent = currentNetState;
                netElement.dataset.off = off() ? 1 : 0;
            }
        }
    }, 3000);
}

function banner(a) {
    const b = $("#ban");
    b.style.display = "block";
    b.innerHTML = "<b>⚠ " + a.level + ":</b> " + esc(a.msg);
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lvC = { Informativa: "#1565c0", Preventiva: "#f9a825", Alta: "#ef6c00", Evacuación: "#c62828" };
const rc = p => p >= 70 ? "#c62828" : p >= 40 ? "#ef6c00" : p >= 20 ? "#f9a825" : "#2e7d32";

function zoneAt(lo, la) {
    let b = ZONES_GEOJSON.features[0].properties, d = 1e9;
    ZONES_GEOJSON.features.forEach(f => {
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
    let threatWeight = 10;
    if (r.threat === 'medio' || r.threat === 'naranja') threatWeight = 25;
    if (r.threat === 'alto' || r.threat === 'rojo') threatWeight = 45;
    return Math.min(100, Math.round(threatWeight + z.v * 30 + Math.min(r.ppl, 50) / 50 * 20 + (h < 3 ? 10 : h < 12 ? 5 : 0) + (r.photo ? 5 : 0)));
}

function risk(prop, sc) {
    const x = (0.035 * sc.rain + 0.45 * sc.river + (sc.tide ? 0.7 : 0)) * (0.6 + prop.v) - 2.2;
    return Math.round(100 / (1 + Math.exp(-x)));
}

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
        if (window.tempPickMarker) mapInstance.removeLayer(window.tempPickMarker);
        if (S.pick) {
            window.tempPickMarker = L.marker([S.pick.la, S.pick.lo], {
                icon: L.divIcon({ className: 'custom-pin', html: '📍', iconSize: [24, 24] })
            }).addTo(mapInstance);
        }
        return;
    }

    // Se eliminó el bloque <div class="hero"> de aquí
    $("#p-map").innerHTML = `
        <div class="card">
            <h2>Mapa de riesgo (OpenStreetMap + PostGIS GeoJSON)</h2>
            <div id="leaflet-map" class="map"></div>
            <p class="mu" id="map-coords-info">Haz clic en el mapa para fijar la ubicación de un reporte${S.pick ? " · fijada: " + S.pick.la.toFixed(4) + ", " + S.pick.lo.toFixed(4) : ""}.</p>
        </div>
        
        <div class="card">
            <h2>Monitoreo Oficial (INAMHI y SNGR)</h2>
            <div class="item">
                <span class="tag" style="background:#1e88e5">INAMHI</span> <b>Advertencia Meteorológica N° 34 (Lluvias)</b>
                <div class="mu">Se pronostican precipitaciones de variable intensidad con tormentas eléctricas en la provincia de Esmeraldas. Vigente 48 horas.</div>
            </div>
            <div class="item">
                <span class="tag" style="background:#ef6c00">SNGR</span> <b>Estado de Alerta Naranja Activa</b>
                <div class="mu">Monitoreo permanente por incremento del caudal en los ríos Esmeraldas y Teaone.</div>
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
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance);

    geoJsonLayer = L.geoJSON(ZONES_GEOJSON, {
        style: feature => ({ color: getSemaphoreColor(feature.properties.v * 100), weight: 2, fillColor: getSemaphoreColor(feature.properties.v * 100), fillOpacity: 0.4 }),
        onEachFeature: (feature, layer) => layer.bindPopup(`<b>${feature.properties.n}</b><br>Tipo: ${feature.properties.t}`)
    }).addTo(mapInstance);

    const blueShelterIcon = L.divIcon({
        className: 'custom-shelter-icon',
        html: '<div style="background-color: #1e88e5; color: white; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; border: 2px solid white; font-size: 14px;">🏠</div>',
        iconSize: [28, 28]
    });

    S.shelters.forEach(a => L.marker([a.la, a.lo], { icon: blueShelterIcon }).addTo(mapInstance).bindPopup(`🏠 <b>${a.n}</b><br>Capacidad: ${a.occ}/${a.cap}`));

    mapInstance.on('click', function(e) {
        S.pick = { lo: e.latlng.lng, la: e.latlng.lat };
        save();
        if (window.tempPickMarker) mapInstance.removeLayer(window.tempPickMarker);
        window.tempPickMarker = L.marker([S.pick.la, S.pick.lo], {
            icon: L.divIcon({ className: 'custom-pin', html: '📍', iconSize: [24, 24] })
        }).addTo(mapInstance);

        const infoText = $("#map-coords-info");
        if (infoText) infoText.textContent = `Haz clic en el mapa para fijar la ubicación de un reporte · fijada: ${S.pick.la.toFixed(4)}, ${S.pick.lo.toFixed(4)}.`;
    });
}

/* ---- Reportes ---- */
let photo = null;

/* ---- Nuevo Dashboard: Reporte Express por Toque (1-Click) ---- */
function renderExpressReportDashboard() {
    return `
        <div class="card" style="background: linear-gradient(135deg, var(--card), var(--ac)); border: 2px solid var(--pr);">
            <h2 style="display: flex; align-items: center; gap: 8px;">
                ⚡ Reporte Express (1-Click)
            </h2>
            <div class="mu" style="margin-bottom: 12px;">
                ¿Emergencia en curso? Toca el botón correspondiente para enviar tu ubicación y alerta de forma inmediata sin rellenar formularios:
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
                <button class="b express-btn" data-type="inundacion" style="background: #1e88e5; display: flex; flex-direction: column; align-items: center; padding: 14px; gap: 4px; height: auto;">
                    <span style="font-size: 26px;">🌊</span>
                    <span style="font-weight: 700; font-size: 13px;">Inundación</span>
                </button>
                
                <button class="b express-btn" data-type="deslizamiento" style="background: #ef6c00; display: flex; flex-direction: column; align-items: center; padding: 14px; gap: 4px; height: auto;">
                    <span style="font-size: 26px;">⛰️</span>
                    <span style="font-weight: 700; font-size: 13px;">Deslizamiento</span>
                </button>
                
                <button class="b express-btn" data-type="via" style="background: #f9a825; color: #12201a; display: flex; flex-direction: column; align-items: center; padding: 14px; gap: 4px; height: auto;">
                    <span style="font-size: 26px;">🚧</span>
                    <span style="font-weight: 700; font-size: 13px;">Vía Bloqueada</span>
                </button>
                
                <button class="b express-btn" data-type="incendio" style="background: #c62828; display: flex; flex-direction: column; align-items: center; padding: 14px; gap: 4px; height: auto;">
                    <span style="font-size: 26px;">🔥</span>
                    <span style="font-weight: 700; font-size: 13px;">Incendio</span>
                </button>
            </div>
        </div>
    `;
}
function viewRep() {
    const p = S.pick, pend = S.reports.filter(r => !r.sync).length;
    
    $("#p-rep").innerHTML = `
        <!-- Bloque Hero existente -->
        <div class="hero">
            <h2>¿Hay una emergencia?</h2>
            <p>Repórtala en segundos, incluso sin señal.</p>
            <div class="qa">
                <button class="sos" onclick="window.scrollTo({ top: 400, behavior: 'smooth' })">📸 Reportar Detallado</button>
                <a href="tel:911">📞 911</a>
                <button onclick="${S.currentUser?.role === 'admin' ? "go('coe')" : "alert('Acceso reservado a personal autorizado COE')" }">🏠 COE</button>
            </div>
        </div>

        <!-- NUEVO DASHBOARD EXPRESS DE 1-CLICK -->
        ${renderExpressReportDashboard()}

        <!-- Formulario detallado clásico -->
        <div class="report-card">
            
            <label>Tipo de Emergencia</label>
            <select id="rt">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
            
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
                    <label>Personas Afectadas</label>
                    <input id="rp" type="number" min="0" value="0">
                </div>
            </div>
            
            <label>Descripción de los Hechos</label>
            <textarea id="rd" rows="3" placeholder="Detalle qué ocurre..."></textarea>
            
            <label>Ubicación</label>
            <div class="row">
                <button class="b s" id="gps">📍 Usar GPS</button>
                <button class="b s" id="mp">🗺️ Elegir en Mapa</button>
            </div>
            <div class="mu" style="margin-top: 6px; font-weight: 600;" id="loc">
                ${p ? "📍 Coordenadas fijadas: " + p.la.toFixed(5) + ", " + p.lo.toFixed(5) : "⚠ Ubicación no seleccionada"}
            </div>
            
            <label>Evidencia Fotográfica</label>
            <div class="camera-upload-box">
                <div class="camera-icon-wrapper">📸</div>
                <div style="font-weight: 600; font-size: 14px; color: var(--tx);">Abrir cámara o cargar foto</div>
                <input id="ph" type="file" accept="image/*" capture="environment">
            </div>
            <div id="pv"></div>
            
            <p style="margin-top: 20px;">
                <button class="b" id="send" style="width: 100%;">🚀 Enviar Reporte</button>
            </p>
        </div>
        
        <div class="report-card">
            <h2>Mis Reportes Registrados (${pend} pendientes)</h2>
            ${S.reports.length ? S.reports.slice().reverse().map(r => `
                <div class="report-history-item">
                    ${r.photo ? `<img class="report-preview-img" src="${r.photo}">` : '<div style="width:60px; height:60px; background:var(--ac); border-radius:12px; display:grid; place-items:center; font-size:20px;">📝</div>'}
                    <div style="flex: 1;">
                        <b>${TYPES[r.type]}</b>
                        <div class="mu">${esc(r.desc || "Sin detalle")}</div>
                    </div>
                </div>
            `).join("") : '<div class="mu">No hay reportes.</div>'}
        </div>`;

    // Eventos interactivos del módulo
    $("#gps").onclick = () => {
        if (!navigator.geolocation) return alert("GPS no disponible");
        navigator.geolocation.getCurrentPosition(g => {
            S.pick = { lo: g.coords.longitude, la: g.coords.latitude };
            save(); viewRep();
        });
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
            $("#pv").innerHTML = `<img class="report-preview-img" src="${photo}" style="margin-top:10px;">`;
        };
        im.src = URL.createObjectURL(f);
    };

    $("#send").onclick = () => {
        if (!S.pick) return alert("Selecciona la ubicación en el mapa");
        const newReport = {
            id: Date.now(), type: $("#rt").value, threat: $("#r-threat").value,
            ppl: +$("#rp").value || 0, desc: $("#rd").value, lo: S.pick.lo, la: S.pick.la, photo: photo, ts: Date.now(), sync: false
        };
        S.reports.push(newReport);
        photo = null; save(); flush(); viewRep();
        alert("¡Reporte guardado!");
    };
    // Eventos para el Reporte Express de 1-Click
    document.querySelectorAll(".express-btn").forEach(btn => {
        btn.onclick = () => {
            const emergencyType = btn.dataset.type;
            
            // Obtener ubicación GPS automática o usar la última fijada
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(g => {
                    saveAndDispatchExpressReport(emergencyType, g.coords.latitude, g.coords.longitude);
                }, () => {
                    if (S.pick) {
                        saveAndDispatchExpressReport(emergencyType, S.pick.la, S.pick.lo);
                    } else {
                        alert("No se pudo obtener el GPS automáticamente. Por favor fija tu ubicación en el mapa.");
                        go('map');
                    }
                }, { timeout: 5000 });
            } else if (S.pick) {
                saveAndDispatchExpressReport(emergencyType, S.pick.la, S.pick.lo);
            } else {
                alert("Por favor selecciona una ubicación en el mapa primero.");
                go('map');
            }
        };
    });
}

function saveAndDispatchExpressReport(type, lat, lng) {
    const expressReport = {
        id: Date.now(),
        type: type,
        threat: "alto", // Por defecto se asume urgencia alta en un toque rápido
        ppl: 1,
        desc: "Reporte rápido automatizado por Botón Express (1-Click)",
        lo: lng,
        la: lat,
        photo: null,
        ts: Date.now(),
        sync: false
    };

    S.reports.push(expressReport);
    save();
    flush();
    viewRep();
    alert(`🚨 ¡Alerta de ${TYPES[type] || type} enviada con éxito! El COE ha recibido tu posición.`);

}

let busy = false;
function flush() {
    if (off() || busy) return;
    const q = S.reports.filter(r => !r.sync);
    if (!q.length) return;
    busy = true;
    setTimeout(() => { q.forEach(r => r.sync = true); busy = false; save(); render(); }, 900);
}

/* ---- COE (Solo Admin) ---- */
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
                <label>Mensaje</label><textarea id="am" rows="2" placeholder="Ej.: Evacuar zona vulneradas"></textarea>
                <p><button class="b d" id="ab">Difundir alerta</button></p>
            </div>
            
            <div class="card">
                <h2>Incidentes priorizados (IA)</h2>
                ${rs.length ? rs.slice(0, 5).map(r => `<div class="item"><span class="tag" style="background:${rc(r.sc)}">${r.sc}</span> <b>${TYPES[r.type]}</b><div class="mu">${esc(r.desc || "")}</div></div>`).join("") : '<div class="mu">Sin incidentes.</div>'}
            </div>
        </div>`;

    $("#ab").onclick = () => {
        const m = $("#am").value.trim();
        if (!m) return;
        const alertObj = { level: $("#al").value, msg: m, ts: Date.now() };
        S.alerts.unshift(alertObj); save(); banner(alertObj); viewCoe();
    };
}

/* ---- IA (Solo Admin) ---- */
function viewIA() {
    const sc = S.sc;
    const rk = ZONES_GEOJSON.features.map(f => risk(f.properties, sc));

    $("#p-ia").innerHTML = `
        <div class="report-card">
            <h2>🧠 Inteligencia Artificial Predictiva (Módulo Administrativo)</h2>
            <div class="card" style="background: var(--bg);">
                <h3>Simulador de Escenarios</h3>
                <label>Lluvia: ${sc.rain} mm/h</label>
                <input type="range" id="r1" min="0" max="100" value="${sc.rain}">
                <label>Río: +${sc.river} m</label>
                <input type="range" id="r2" min="0" max="6" step=".5" value="${sc.river}">
            </div>
        </div>`;

    $("#r1").oninput = e => { S.sc.rain = +e.target.value; save(); viewIA(); };
    $("#r2").oninput = e => { S.sc.river = +e.target.value; save(); viewIA(); };
}

/* ---- Navegación y Renderizado de Vistas según Rol ---- */
let cur = "map";
const V = { map: () => viewMap(), rep: viewRep, coe: viewCoe, ia: viewIA };

function go(t) { 
    cur = t; 
    render(); 
}

function render() {
    const userRole = S.currentUser ? S.currentUser.role : null;
    
    // Filtrar pestañas visibles según el rol del usuario autenticado
    const visibleTabs = ALL_TABS.filter(([k, i, n, roles]) => roles.includes(userRole));

    // Si intenta acceder a una vista no permitida, forzar redirección al mapa
    const currentTabData = ALL_TABS.find(([k]) => k === cur);
    if (!currentTabData || !currentTabData[3].includes(userRole)) {
        cur = "map";
    }

    $("#nav").innerHTML = visibleTabs.map(([k, i, n]) => `<button data-t="${k}" class="${k == cur ? "on" : ""}"><span>${i}</span>${n}</button>`).join("");
    
    document.querySelectorAll("#nav button").forEach(b => b.onclick = () => go(b.dataset.t));
    document.querySelectorAll(".pan").forEach(p => p.classList.toggle("on", p.id == "p-" + cur));
    
    if (V[cur]) V[cur]();

    const n = $("#net");
    if (n) {
        n.textContent = off() ? "● Sin conexión" : "● En línea";
        n.dataset.off = off() ? 1 : 0;
    }
}

// Inicialización
initAuth();
render();
initRealTimeSync();