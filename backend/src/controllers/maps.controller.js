const pool = require('../config/db');

// Obtener Zonas de Riesgo (Polígonos) en formato GeoJSON
const getZonasRiesgo = async (req, res) => {
  try {
    const query = `
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(poligono_geom)::json,
          'properties', json_build_object(
            'id', id,
            'nombre_sector', nombre_sector,
            'tipo_amenaza', tipo_amenaza,
            'nivel_riesgo', nivel_riesgo
          )
        ))
      ) AS geojson
      FROM zonas_riesgo;
    `;

    const result = await pool.query(query);
    const geojson = result.rows[0].geojson || { type: 'FeatureCollection', features: [] };

    res.json(geojson);
  } catch (error) {
    console.error('Error al obtener zonas de riesgo:', error);
    res.status(500).json({ error: 'Error interno al consultar zonas de riesgo' });
  }
};

// Obtener Incidentes de Emergencia (Puntos) en formato GeoJSON
const getIncidentes = async (req, res) => {
  try {
    const query = `
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(ubicacion_geom)::json,
          'properties', json_build_object(
            'id', id,
            'fuente_origen', fuente_origen,
            'tipo_evento', tipo_evento,
            'gravedad', gravedad,
            'estado', estado,
            'personas_afectadas', personas_afectadas,
            'creado_en', creado_en
          )
        ))
      ) AS geojson
      FROM incidentes_emergencia;
    `;

    const result = await pool.query(query);
    const geojson = result.rows[0].geojson || { type: 'FeatureCollection', features: [] };

    res.json(geojson);
  } catch (error) {
    console.error('Error al obtener incidentes:', error);
    res.status(500).json({ error: 'Error interno al consultar incidentes' });
  }
};

module.exports = {
  getZonasRiesgo,
  getIncidentes
};