// Modal de detalle de caso para CLIENTE (solo lectura)

(function(){
  const overlay = document.getElementById('clienteModalOverlay');
  const container = document.getElementById('clienteModalContainer');
  const closeBtn = document.getElementById('clienteModalClose');
  const bodyDiv = document.getElementById('clienteModalBody');

  // Cerrar modal
  function close(){
    overlay.style.display = 'none';
    container.style.display = 'none';
    bodyDiv.innerHTML = '';
  }
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  // Cerrar con ESC
  document.addEventListener('keyup', function(e){
    if(e.key==='Escape') close();
  });

  // Formatea fecha
  function formatDate(str){
    const d = new Date(str);
    return d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'});
  }

  // Abrir modal con datos
  window.abrirDetalleCasoCliente = async function(casoId){
    overlay.style.display = 'block';
    container.style.display = 'block';
    bodyDiv.innerHTML = '<div class="modal-loading">Cargando...</div>';
    try{
      const res = await fetch(`/api/casos/${casoId}`,{
        headers:{'Authorization':`Bearer ${localStorage.getItem('token')}`}
      });
      if(!res.ok) throw new Error('Error al obtener caso');
      const data = await res.json();
      const c = data.caso || data;
      bodyDiv.innerHTML = `
        <h2>${c.titulo}</h2>
        <p><strong>Expediente:</strong> ${c.numeroExpediente}</p>
        <p><strong>Tipo:</strong> ${c.tipo}</p>
        <p><strong>Prioridad:</strong> ${c.prioridad}</p>
        <p><strong>Estado:</strong> ${c.estado}</p>
        <p><strong>Fecha registro:</strong> ${formatDate(c.fechaRegistro)}</p>
        <p><strong>Última actualización:</strong> ${c.fechaActualizacion?formatDate(c.fechaActualizacion):'N/A'}</p>
        <h3>Descripción</h3>
        <p>${c.descripcion}</p>
        <h3>Archivos (${c.archivos?c.archivos.length:0})</h3>
        <ul>
          ${(c.archivos||[]).map(a=>`<li><a href="${a.url}" target="_blank">${a.nombre}</a></li>`).join('')||'<li>No hay archivos</li>'}
        </ul>
        <h3>Comentarios (${c.comentarios?c.comentarios.length:0})</h3>
        <ul>
          ${(c.comentarios||[]).map(cm=>`<li>${cm.texto} <em>(${formatDate(cm.fecha)})</em></li>`).join('')||'<li>No hay comentarios</li>'}
        </ul>
      `;
    }catch(err){
      console.error(err);
      bodyDiv.innerHTML='<p>Error al cargar datos.</p>';
    }
  }
})();
