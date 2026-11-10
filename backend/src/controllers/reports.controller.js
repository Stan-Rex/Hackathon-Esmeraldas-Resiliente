const pool = require('../config/db');

// Registrar uno o varios reportes (ideal para sincronización offline en lote)
const createReports = async (req, res) => {
  try {
    // Aceptamos tanto un solo objeto como un array de reportes (sincronización offline)
    const rawData = req.body;
    const reports = Array.isArray(rawData) ? rawData : [rawData];

    if (reports.length === 0 || !reports[0].tipo_evento) {
      return res.status(400).json({ error: 'No se enviaron datos de reportes válidos.' });
    }

    const insertedReports = [];

    for (const report of reports) {
      const { tipo_evento, gravedad, personas_afectadas, lat, lng } = report;

      // Validación básica de campos obligatorios y coordenadas
      if (!tipo_evento || lat === undefined || lng === undefined) {
        continue; // O puedes retornar un error si prefieres estricta validación
      }

      // Query para insertar el incidente usando PostGIS (ST_MakePoint con longitud, latitud)
      const query = `
        INSERT INTO incidentes_emergencia (
          fuente_origen, 
          tipo_evento, 
          gravedad, 
          estado, 
          personas_afectadas, 
          ubicacion_geom
        ) 
        VALUES (
          'REPORTE_CIUDADANO', 
          $1, 
          $2, 
          'PENDIENTE', 
          $3, 
          ST_SetSRID(ST_MakePoint($4, $5), 4326)
        )
        RETURNING id, tipo_evento, gravedad, estado, creado_en;
      `;

      // Nota: ST_MakePoint recibe primero la longitud (lng) y luego la latitud (lat)
      const values = [
        tipo_evento,
        gravedad || 'MEDIO', // Valor por defecto si no viene especificado
        personas_afectadas || 0,
        lng,
        lat
      ];

      const result = await pool.query(query, values);
      insertedReports.push(result.rows[0]);
    }

    res.status(201).json({
      mensaje: "Reportes procesados y sincronizados exitosamente 📡",
      total_sincronizados: insertedReports.length,
      reportes: insertedReports
    });

  } catch (error) {
    console.error('Error al sincronizar reportes offline:', error);
    res.status(500).json({ error: 'Error interno al procesar los reportes.' });
  }
};

module.exports = {
  createReports
};