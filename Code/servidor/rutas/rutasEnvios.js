const express = require('express');
const router = express.Router();
const ControladorEnvios = require('../controladores/ControladorEnvios');

const controlador = new ControladorEnvios();

router.post('/ubicacion', (req, res) => controlador.registrarUbicacion(req, res));
router.patch('/:envioId/evidencia', (req, res) => controlador.actualizarEvidencia(req, res));

module.exports = router;
