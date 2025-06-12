// Variables globales
var casoActual = null;

// Función para obtener el token JWT de las cookies
function obtenerTokenDeCookie() {
    const match = document.cookie.split('; ').find(r => r.startsWith('token='));
    return match ? match.split('=')[1] : null;
}

// Inicializar eventos cuando el documento esté listo
$(document).ready(function() {
    console.log('Inicializando eventos del modal');
    
    // Verificar que las pestañas estén configuradas correctamente
    console.log('Verificando pestañas:');
    console.log('- Pestaña info:', document.getElementById('info'));
    console.log('- Pestaña actions:', document.getElementById('actions'));
    console.log('- Pestaña comments:', document.getElementById('comments'));
    console.log('- Botón info:', document.getElementById('btn-info'));
    console.log('- Botón actions:', document.getElementById('btn-actions'));
    console.log('- Botón comments:', document.getElementById('btn-comments'));
    
    // Evento para cerrar el modal
    $('.modal-close, .modal-overlay').on('click', function() {
        cerrarModal();
    });
    
    // Evitar que los clics dentro del modal lo cierren
    $('.modal-container').on('click', function(e) {
        e.stopPropagation();
    });
    
    // Evento para cambiar el estado del caso
    $('#btnCambiarEstado').on('click', function() {
        cambiarEstadoCaso();
    });
    
    // Evento para agregar un comentario
    $('#btnAgregarComentario').on('click', function() {
        agregarComentarioCaso();
    });
    
    // Manejar el evento de escape para cerrar el modal
    $(document).keyup(function(e) {
        if (e.key === "Escape") {
            cerrarModal();
        }
    });
    
    // Eventos específicos para cada botón de pestaña
    $(document).on('click', '.tab-btn[data-tab="info"]', function() {
        console.log('Clic en pestaña Info');
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').removeClass('active');
        $('#info').addClass('active');
    });
    
    $(document).on('click', '.tab-btn[data-tab="actions"]', function() {
        console.log('Clic en pestaña Actions');
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').removeClass('active');
        $('#actions').addClass('active');
    });
    
    $(document).on('click', '.tab-btn[data-tab="comments"]', function() {
        console.log('Clic en pestaña Comments');
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').removeClass('active');
        $('#comments').addClass('active');
    });
});

// Función para abrir el modal con los detalles del caso
window.abrirDetalleCaso = function(casoId) {
    console.log('Abriendo modal para caso:', casoId);

    // Mostrar overlay y modal
    $('.modal-overlay').fadeIn(300);
    $('.modal-container').fadeIn(300);

    // Mostrar spinner de carga
    $('#modalLoadingSpinner').show();
    $('#modalCasoContent').hide();
    
    // Asegurarse de que todas las pestañas estén ocultas inicialmente
    document.querySelectorAll('.tab-content').forEach(function(tab) {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    
    // Cargar datos del caso
    const token = obtenerTokenDeCookie();
    $.ajax({
        url: `/abogado/api/casos/${casoId}`,
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        success: function(response) {
            console.log('Respuesta del servidor:', response); // Para debug
            
            // Verificar la estructura de la respuesta
            const caso = response.caso || response;
            
            if (!caso) {
                console.error('No se recibieron datos válidos del caso');
                alert('Error al cargar los datos del caso. Por favor, intente nuevamente.');
                cerrarModal();
                return;
            }

            casoActual = caso;
            
            // Actualizar información del caso
            actualizarModalConDatosDeCaso(caso);
            
            // Activar la primera pestaña por defecto
            // Llamar directamente a la función sin depender del evento
            setTimeout(function() {
                console.log('Activando pestaña info por defecto');
                mostrarPestana('info');
            }, 100);
            
            // Mostrar contenido y ocultar spinner
            $('#modalLoadingSpinner').hide();
            $('#modalCasoContent').show();
        },
        error: function(error) {
            console.error('Error al cargar datos del caso:', error);
            alert('Error al cargar los datos del caso. Por favor, intente nuevamente.');
            $('#modalLoadingSpinner').hide();
            cerrarModal();
        }
    });
};

// Función para actualizar el modal con los datos del caso
function actualizarModalConDatosDeCaso(caso) {
    console.log('Datos del caso recibidos:', caso); // Para debug

    // Verificar que caso existe y tiene las propiedades necesarias
    if (!caso) {
        console.error('No se recibieron datos del caso');
        return;
    }

    // Actualizar título y número de expediente
    $('#casoTitulo').text(caso.titulo);
    $('#casoExpediente').text(`Expediente: ${caso.numeroExpediente}`);

    // Actualizar badge de estado
    const estadoBadge = $('#casoEstadoBadge');
    estadoBadge.text(caso.estado.charAt(0).toUpperCase() + caso.estado.slice(1));
    estadoBadge.removeClass().addClass('caso-estado badge-' + caso.estado);

    // Actualizar selector de estado
    $('#estadoSelector').val(caso.estado);

    // Actualizar prioridad
    const prioridadBadge = $('#casoPrioridad');
    prioridadBadge.text(caso.prioridad.charAt(0).toUpperCase() + caso.prioridad.slice(1));
    
    // Actualizar descripción y tipo
    $('#casoDescripcion').text(caso.descripcion);
    $('#casoTipo').text(formatearTipoCaso(caso.tipo));

    // Actualizar información del cliente
    if (caso.clienteId) {
        $('#casoCliente').text(`${caso.clienteId.nombre} ${caso.clienteId.apellido}`);
        $('#casoClienteContacto').text(`Email: ${caso.clienteId.email} | Tel: ${caso.clienteId.telefono || 'No disponible'}`);
    } else {
        $('#casoCliente').text('Cliente no disponible');
        $('#casoClienteContacto').text('');
    }

    // Actualizar fechas
    $('#casoFechaRegistro').text(formatearFecha(caso.fechaRegistro));
    $('#casoFechaActualizacion').text(formatearFecha(caso.fechaActualizacion));

    // Actualizar archivos
    if (caso.archivos && caso.archivos.length > 0) {
        const archivosHtml = caso.archivos.map(archivo => {
            return `
                <li class="archivo-item">
                    <div class="archivo-icon">
                        <i class="fas ${getIconoArchivo(archivo.tipo)}"></i>
                    </div>
                    <div class="archivo-nombre">${archivo.nombre}</div>
                    <div class="archivo-fecha">${formatearFecha(archivo.fechaSubida)}</div>
                </li>
            `;
        }).join('');
        $('#casoArchivos').html(archivosHtml);
    } else {
        $('#casoArchivos').html('<li>No hay archivos adjuntos</li>');
    }

    // Cargar comentarios
    cargarComentarios(caso.comentarios);
}

// Función simple para mostrar una pestaña
function mostrarTab(tabId) {
    console.log('Mostrando pestaña (función antigua):', tabId);
    mostrarPestana(tabId);
}

// Nueva función para mostrar pestañas
function mostrarPestana(tabId) {
    console.log('Mostrando pestaña:', tabId);
    
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(function(tab) {
        tab.style.display = 'none';
    });
    
    // Quitar la clase active de todos los botones
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    var tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.style.display = 'block';
    } else {
        console.error('No se encontró el elemento con ID:', tabId);
    }
    
    // Activar el botón correspondiente
    var btnId = 'btn-' + tabId;
    var btnElement = document.getElementById(btnId);
    if (btnElement) {
        btnElement.classList.add('active');
    }
    
    // Guardar la pestaña activa en una variable global
    window.tabActiva = tabId;
}


// Función para formatear fechas
function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para formatear tipo de caso
function formatearTipoCaso(tipo) {
    const tiposMapeados = {
        'divorcio': 'Divorcio',
        'contrato_laboral': 'Contrato Laboral',
        'herencia': 'Herencia',
        'penal': 'Caso Penal',
        'civil': 'Caso Civil',
        'otros': 'Otros'
    };

    return tiposMapeados[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
}
// Función para obtener icono según tipo de archivo
function getIconoArchivo(tipoMime) {
    if (tipoMime.includes('pdf')) {
        return 'fa-file-pdf';
    } else if (tipoMime.includes('word') || tipoMime.includes('document')) {
        return 'fa-file-word';
    } else if (tipoMime.includes('image')) {
        return 'fa-file-image';
    } else {
        return 'fa-file';
    }
}

// Función para cerrar el modal
function cerrarModal() {
    console.log('Cerrando modal');
    $('.modal-overlay, .modal-container').fadeOut(300);
    // Limpiar datos
    casoActual = null;
}

// Asignar la función cerrarModal al objeto window
window.cerrarModal = cerrarModal;

// Función para cargar comentarios
function cargarComentarios(comentarios) {
    const $comentariosList = $('#comentariosList');
    $comentariosList.empty();
    
    // Actualizar contador de comentarios
    const comentariosCount = comentarios && comentarios.length ? comentarios.length : 0;
    $('#commentsCount').text(comentariosCount);
    
    if (comentarios && comentarios.length > 0) {
        // Ordenar comentarios por fecha (más recientes primero)
        comentarios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        comentarios.forEach(comentario => {
            const fecha = new Date(comentario.fecha);
            const fechaFormateada = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;
            
            // Determinar si el comentario ha sido visto
            const vistoClass = comentario.visto === false ? 'comentario-no-visto' : '';
            const vistoIcon = comentario.visto === false ? '<span class="visto-badge"><i class="fas fa-eye"></i> Nuevo</span>' : '';
            
            const $comentario = $(`
                <div class="comentario-item ${vistoClass}">
                    <div class="comentario-header">
                        <div class="comentario-autor">
                            ${comentario.autor ? comentario.autor.nombre : 'Usuario'}
                            ${vistoIcon}
                        </div>
                        <div class="comentario-fecha">${fechaFormateada}</div>
                    </div>
                    <div class="comentario-texto">${comentario.texto}</div>
                </div>
            `);
            
            $comentariosList.append($comentario);
        });
    } else {
        $comentariosList.html('<div class="comentario-empty">No hay comentarios para este caso.</div>');
    }
}

// Función para cambiar el estado del caso
function cambiarEstadoCaso() {
    if (!casoActual) return;

    const nuevoEstado = $('#estadoSelector').val();
    if (nuevoEstado === casoActual.estado) {
        alert('El caso ya tiene ese estado.');
        return;
    }

    // Deshabilitar el botón mientras se envía
    const $btnCambiarEstado = $('#btnCambiarEstado');
    const btnTextoOriginal = $btnCambiarEstado.html();
    $btnCambiarEstado.html('<i class="fas fa-spinner fa-spin"></i> Actualizando...').prop('disabled', true);

    const token = obtenerTokenDeCookie();
    $.ajax({
        url: `/abogado/api/casos/${casoActual._id}/estado`,
        method: 'PUT',
        data: { estado: nuevoEstado },
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        success: function(response) {
            // Actualizar badge de estado
            const estadoBadge = $('#casoEstadoBadge');
            estadoBadge.text(nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1));
            estadoBadge.removeClass().addClass('caso-estado badge-' + nuevoEstado);

            // Actualizar estado actual en la sección de acciones
            $('#currentStatus').text(nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1));

            // Actualizar caso actual
            casoActual.estado = nuevoEstado;
            
            // Actualizar comentarios si vienen en la respuesta
            if (response.caso && response.caso.comentarios) {
                cargarComentarios(response.caso.comentarios);
                // Cambiar a la pestaña de comentarios para mostrar el nuevo comentario
                mostrarPestana('comments');
            }
            
            // Mostrar alerta de éxito
            alert('Estado actualizado correctamente');
            
            // Restaurar el botón
            $btnCambiarEstado.html(btnTextoOriginal).prop('disabled', false);
        },
        error: function(error) {
            console.error('Error al actualizar estado:', error);
            alert('Error al actualizar el estado. Por favor, intente nuevamente.');
            
            // Restaurar el botón
            $btnCambiarEstado.html(btnTextoOriginal).prop('disabled', false);
        }
    });
}

// Función para agregar un comentario al caso
function agregarComentarioCaso() {
    if (!casoActual) return;

    const texto = $('#nuevoComentario').val().trim();
    if (!texto) {
        alert('Por favor, escribe un comentario antes de enviarlo.');
        return;
    }

    // Deshabilitar el botón mientras se envía
    const $btnAgregarComentario = $('#btnAgregarComentario');
    const btnTextoOriginal = $btnAgregarComentario.html();
    $btnAgregarComentario.html('<i class="fas fa-spinner fa-spin"></i> Enviando...').prop('disabled', true);

    const token = obtenerTokenDeCookie();
    $.ajax({
        url: `/abogado/api/casos/${casoActual._id}/nota`,
        method: 'POST',
        data: { texto },
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        success: function(response) {
            // Limpiar campo
            $('#nuevoComentario').val('');

            // Actualizar comentarios si vienen en la respuesta
            if (response.comentarios) {
                cargarComentarios(response.comentarios);
            }
            
            // Cambiar a la pestaña de comentarios
            mostrarPestana('comments');
            
            // Mostrar alerta de éxito
            alert('Nota agregada correctamente');
            
            // Restaurar el botón
            $btnAgregarComentario.html(btnTextoOriginal).prop('disabled', false);
        },
        error: function(error) {
            console.error('Error al agregar nota:', error);
            alert('Error al agregar la nota. Por favor, intente nuevamente.');
            
            // Restaurar el botón
            $btnAgregarComentario.html(btnTextoOriginal).prop('disabled', false);
        }
    });
}