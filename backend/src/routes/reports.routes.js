const { Router } = require('express');
const { createReports } = require('../controllers/reports.controller');

const router = Router();

// Endpoint POST para recibir reportes (individuales o en lote offline)
// Ruta final: POST /api/reports
router.post('/', createReports);

module.exports = router;