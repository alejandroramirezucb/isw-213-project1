const express = require('express');
const router = express.Router();

router.post('/fallback', async (req, res) => {
  try {
    const { id, nombre_completo, correo_electronico, telefono, rol } = req.body;
    if (!id || !correo_electronico) return res.status(400).json({ error: 'ID y correo son obligatorios' });

    const supabase = require('../db');
    const { error } = await supabase.from('usuarios').upsert(
      { id, nombre_completo: nombre_completo || 'Usuario Nuevo', correo_electronico, telefono: telefono || null, rol: rol || 'cliente' },
      { onConflict: 'id' },
    );

    if (error) {
      const mensajes = { '42501': 'RLS bloqueó el INSERT. Configura SUPABASE_SERVICE_ROLE_KEY', '23503': 'El usuario aún no existe en auth.users. Espera e intenta de nuevo.' };
      return res.status(500).json({ error: mensajes[error.code] || error.message });
    }

    return res.json({ success: true, message: 'Usuario sincronizado' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
