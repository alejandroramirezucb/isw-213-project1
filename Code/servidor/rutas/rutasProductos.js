const express = require('express');
const router = express.Router();
const { mapearProducto } = require('../utils');
const RepositorioProductos = require('../repositorios/RepositorioProductos');
const ServicioProductos = require('../servicios/ServicioProductos');
const ControladorProductos = require('../controladores/ControladorProductos');

const repositorio = new RepositorioProductos();
const servicio = new ServicioProductos(repositorio, { mapear: mapearProducto });
const controlador = new ControladorProductos(servicio);

router.get('/', (req, res) => controlador.obtenerTodos(req, res));
router.get('/:id', (req, res) => controlador.obtenerPorId(req, res));
router.get('/:id/stock', (req, res) => controlador.verificarStock(req, res));

router.post('/stock-batch', async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ error: 'Se requiere un arreglo de ids' });

    const supabase = require('../db');
    const { data, error } = await supabase.from('productos').select('id, stock_disponible').in('id', ids);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ stocks: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
