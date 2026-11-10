const express = require('express');
const cors = require('cors');
require('dotenv').config();

const mapsRoutes = require('./routes/maps.routes');
const reportsRoutes = require('./routes/reports.routes');
const coeRoutes = require('./routes/coe.routes'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: "API de Esmeraldas Resiliente corriendo correctamente 🚀" });
});

// Registrar rutas
app.use('/api/maps', mapsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/coe', coeRoutes); 

app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});