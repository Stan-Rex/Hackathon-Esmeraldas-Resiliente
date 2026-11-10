const pool = require('../config/db');

// 1. Obtener todos los incidentes para el panel del COE (con filtros opcionales por estado o gravedad)
const getCoeIncidents = async (req, res) => {
  try {
    const { estado, gravedad } = req.query;
    
    let query = `
      SELECT id, fuente_origen, tipo_evento, gravedad, estado, personas_afectadas, 
             ST_X(ubicacion_geom) AS lng, ST_Y(ubicacion_geom) AS lat, creado_en 
      FROM incidentes_emergencia
    `;
    
    const values = [];
    const conditions = [];

    // Filtros dinámicos opcionales (ej: /api/coe/incidents?estado=PENDIENTE)
    if (estado) {
      conditions.push(`estado = $${values.length + 1}`);
      values.push(estado);
    }
    if (gravedad) {
      conditions.push(`gravedad = $${values.length + 1}`);
      values.push(gravedad);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY creado_en DESC;`;

    const result = await pool.query(query, values);
    
    res.json({
      total: result.rowCount,
      incidentes: result.rows
    });

  } catch (error) {
    console.error('Error al obtener incidentes para el COE:', error);
    res.status(500).json({ error: 'Error interno al consultar el panel del COE.' });
  }
};

// 2. Actualizar el estado de un incidente (Ej: PENDIENTE -> ATENDIDO)
const updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estados permitidos según tu esquema de base de datos o lógica operativa
    const estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'ATENDIDO', 'CANCELADO'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: `Estado inválido. Los estados permitidos son: ${estadosValidos.join(', ')}` 
      });
    }

    const query = `
      UPDATE incidentes_emergencia 
      SET estado = $1 
      WHERE id = $2 
      RETURNING id, tipo_evento, estado, actualizado_en;
    `;
    
    // Nota: si no tienes la columna actualizado_en, puedes omitirla del RETURNING
    const simpleQuery = `
      UPDATE incidentes_emergencia 
      SET estado = $1 
      WHERE id = $2 
      RETURNING id, tipo_evento, estado;
    `;

    const result = await pool.query(simpleQuery, [estado, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Incidente no encontrado.' });
    }

    res.json({
      mensaje: "Estado del incidente actualizado exitosamente 🛡️",
      incidente: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar el estado del incidente:', error);
    res.status(500).json({ error: 'Error interno al actualizar el incidente.' });
  }
};

module.exports = {
  getCoeIncidents,
  updateIncidentStatus
};