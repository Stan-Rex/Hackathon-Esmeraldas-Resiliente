const pool = require('./config/db');

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando la siembra de datos de prueba...');

    // 1. Insertar Zonas de Riesgo
    await pool.query(`
      INSERT INTO zonas_riesgo (nombre_sector, tipo_amenaza, nivel_riesgo, poligono_geom) 
      VALUES 
      (
        'RIBERA DEL RIO ESMERALDAS (Sector La Barraca)', 
        'INUNDACION', 
        'CRITICO',
        ST_GeomFromText('POLYGON((-79.6600 0.9650, -79.6550 0.9650, -79.6550 0.9600, -79.6600 0.9600, -79.6600 0.9650))', 4326)
      ),
      (
        'LADERAS DE SAN MATEO', 
        'DESLIZAMIENTO', 
        'ALTO',
        ST_GeomFromText('POLYGON((-79.6400 0.9500, -79.6350 0.9500, -79.6350 0.9450, -79.6400 0.9450, -79.6400 0.9500))', 4326)
      );
    `);
    console.log('✅ Zonas de riesgo insertadas.');

    // 2. Insertar Incidentes de Emergencia
    await pool.query(`
      INSERT INTO incidentes_emergencia (fuente_origen, tipo_evento, gravedad, estado, personas_afectadas, ubicacion_geom) 
      VALUES 
      (
        'REPORTE_CIUDADANO',
        'Desbordamiento de río',
        'ALTO',
        'PENDIENTE',
        15,
        ST_SetSRID(ST_MakePoint(-79.6540, 0.9580), 4326)
      ),
      (
        'ALERTA_OFICIAL',
        'Colapso estructural leve',
        'MEDIO',
        'EN_PROCESO',
        4,
        ST_SetSRID(ST_MakePoint(-79.6510, 0.9610), 4326)
      ),
      (
        'REPORTE_CIUDADANO',
        'Vía bloqueada por deslizamiento',
        'CRITICO',
        'PENDIENTE',
        30,
        ST_SetSRID(ST_MakePoint(-79.6450, 0.9480), 4326)
      );
    `);
    console.log('✅ Incidentes de emergencia insertados.');

    console.log('🚀 ¡Base de datos poblada con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al insertar los datos de prueba:', error.message);
    process.exit(1);
  }
};

seedDatabase();