const express = require('express');
const router = express.Router();
const ControladorMensajes = require('../controladores/ControladorMensajes');

const controlador = new ControladorMensajes();

router.get('/', (req, res) => controlador.obtenerTodos(req, res));
router.post('/', (req, res) => controlador.crear(req, res));
router.patch('/:id/responder', (req, res) => controlador.responder(req, res));

module.exports = router;
