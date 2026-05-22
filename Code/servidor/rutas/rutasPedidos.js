const express = require('express');
const router = express.Router();
const ControladorPedidos = require('../controladores/ControladorPedidos');

const controlador = new ControladorPedidos();

router.post('/', (req, res) => controlador.crear(req, res));
router.get('/admin', (req, res) => controlador.obtenerAdmin(req, res));
router.get('/:pedidoId/historial-estados', (req, res) => controlador.obtenerHistorialEstados(req, res));
router.patch('/:pedidoId/estado', (req, res) => controlador.avanzarEstado(req, res));
router.patch('/:pedidoId/confirmar-recepcion', (req, res) => controlador.confirmarRecepcion(req, res));

module.exports = router;
