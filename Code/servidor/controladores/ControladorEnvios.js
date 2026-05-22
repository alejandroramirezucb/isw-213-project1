const supabase = require('../db');

class ControladorEnvios {
  async registrarUbicacion(req, res) {
    try {
      const { envio_id, latitud, longitud } = req.body;
      if (!envio_id || latitud === undefined || longitud === undefined) {
        return res.status(400).json({ error: 'envio_id, latitud y longitud son requeridos' });
      }
      const { data, error } = await supabase.from('historial_ubicaciones').insert({ envio_id, latitud, longitud }).select();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ubicacion: data[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async actualizarEvidencia(req, res) {
    try {
      const { envioId } = req.params;
      const { foto_evidencia_url } = req.body;
      if (!foto_evidencia_url) return res.status(400).json({ error: 'foto_evidencia_url es requerido' });
      const { data, error } = await supabase.from('envios').update({ foto_evidencia_url }).eq('id', envioId).select();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ envio: data[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = ControladorEnvios;
