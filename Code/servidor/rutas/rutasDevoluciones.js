const express = require('express');
const router = express.Router();
const ControladorDevoluciones = require('../controladores/ControladorDevoluciones');

const controlador = new ControladorDevoluciones();

router.get('/', (req, res) => controlador.obtenerTodas(req, res));
router.post('/', (req, res) => controlador.crear(req, res));
router.patch('/:devolucionId/aprobar', (req, res) => controlador.aprobar(req, res));
router.patch('/:devolucionId/rechazar', (req, res) => controlador.rechazar(req, res));

module.exports = router;
