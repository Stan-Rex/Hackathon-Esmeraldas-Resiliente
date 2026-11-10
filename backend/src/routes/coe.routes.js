const { Router } = require('express');
const { getCoeIncidents, updateIncidentStatus } = require('../controllers/coe.controller');

const router = Router();

// GET /api/coe/incidents - Lista todos los incidentes para la tabla del panel COE
router.get('/incidents', getCoeIncidents);

// PATCH /api/coe/incidents/:id/status - Actualiza el estado de un incidente específico
router.patch('/incidents/:id/status', updateIncidentStatus);

module.exports = router;