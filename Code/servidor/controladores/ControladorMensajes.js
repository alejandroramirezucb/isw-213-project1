const supabase = require('../db');

class ControladorMensajes {
  async obtenerTodos(req, res) {
    try {
      const { data, error } = await supabase.from('mensajes_ayuda').select('*').order('fecha_creacion', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ mensajes: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async crear(req, res) {
    try {
      const { usuario_id, nombre, email, categoria, mensaje } = req.body || {};
      if (!nombre || !email || !categoria || !mensaje) {
        return res.status(400).json({ error: 'nombre, email, categoria y mensaje son requeridos' });
      }
      const { data, error } = await supabase.from('mensajes_ayuda').insert({ usuario_id: usuario_id || null, nombre, email, categoria, mensaje, estado: 'pendiente' }).select();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ mensaje: data[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async responder(req, res) {
    try {
      const { id } = req.params;
      const { respuesta_admin } = req.body;
      if (!respuesta_admin) return res.status(400).json({ error: 'respuesta_admin es requerido' });

      const { data: mensaje } = await supabase.from('mensajes_ayuda').select('id, estado').eq('id', id).single();
      if (!mensaje) return res.status(404).json({ error: 'Mensaje no encontrado' });
      if (mensaje.estado === 'respondido') return res.status(400).json({ error: 'El mensaje ya fue respondido' });

      const { data, error } = await supabase.from('mensajes_ayuda').update({ estado: 'respondido', respuesta_admin, fecha_respuesta: new Date().toISOString() }).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ mensaje: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = ControladorMensajes;
