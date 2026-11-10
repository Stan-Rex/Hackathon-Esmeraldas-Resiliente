const { Router } = require('express');
const { getZonasRiesgo, getIncidentes } = require('../controllers/maps.controller');

const router = Router();

// GET /api/maps/zonas-riesgo
router.get('/zonas-riesgo', getZonasRiesgo);

// GET /api/maps/incidentes
router.get('/incidentes', getIncidentes);

module.exports = router;