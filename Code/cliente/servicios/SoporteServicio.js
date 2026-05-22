class SoporteServicio {
  async obtenerMensajes() {
    const respuesta = await fetch('/api/mensajes-ayuda');
    const json = await respuesta.json();
    if (!respuesta.ok) throw new Error(json.error || respuesta.statusText);
    return json.mensajes || [];
  }

  async enviarMensaje(datos) {
    const respuesta = await fetch('/api/mensajes-ayuda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const json = await respuesta.json();
    if (!respuesta.ok || json.error) throw new Error(json.error || respuesta.statusText);
    return json;
  }

  async responderMensaje(id, respuesta) {
    const res = await fetch(`/api/mensajes-ayuda/${id}/responder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respuesta_admin: respuesta }),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || res.statusText);
    return json;
  }

  async obtenerConsultasUsuario(supabase, usuarioId) {
    const { data, error } = await supabase
      .from('mensajes_ayuda')
      .select('id, categoria, mensaje, respuesta_admin, estado, fecha_creacion, fecha_respuesta')
      .eq('usuario_id', usuarioId)
      .order('fecha_creacion', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }
}

export default SoporteServicio;
