class DevolucionServicio {
  constructor(clienteSupabase) {
    this._supabase = clienteSupabase;
  }

  async obtenerDevoluciones() {
    const respuesta = await fetch('/api/devoluciones');
    const json = await respuesta.json();
    if (!respuesta.ok) throw new Error(json.error || respuesta.statusText);
    return json.devoluciones || [];
  }

  async procesar(devolucionId, accion, observaciones) {
    const respuesta = await fetch(`/api/devoluciones/${devolucionId}/${accion}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observaciones_admin: observaciones }),
    });
    const json = await respuesta.json();
    if (!respuesta.ok || json.error) throw new Error(json.error || respuesta.statusText);
    return json;
  }

  async subirFotoDevolucion(pedidoId, archivo) {
    const nombreArchivo = `factura_${pedidoId}_${Date.now()}.jpg`;
    const rutaArchivo = `facturas/${nombreArchivo}`;

    const { error, data } = await this._supabase.storage
      .from('devoluciones')
      .upload(rutaArchivo, archivo, { contentType: archivo.type });

    if (error) {
      return `factura_local_${pedidoId}_${Date.now()}`;
    }

    const { data: urlData } = this._supabase.storage
      .from('devoluciones')
      .getPublicUrl(rutaArchivo);

    return urlData.publicUrl;
  }

  async enviarSolicitud(pedidoId, motivo, fotoUrl) {
    const respuesta = await fetch('/api/devoluciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pedido_id: parseInt(pedidoId, 10),
        motivo_devolucion: motivo,
        foto_factura_url: fotoUrl,
      }),
    });
    const json = await respuesta.json();
    if (!respuesta.ok || json.error) throw new Error(json.error || respuesta.statusText);
    return json;
  }
}

export default DevolucionServicio;
