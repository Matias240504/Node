/**
 * Dashboard de Abogado - Funcionalidades JavaScript
 * 
 * Este archivo contiene las funciones para hacer que el dashboard 
 * de abogado sea interactivo y cargue datos en tiempo real.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos DOM
    const casosActivosElement = document.querySelector('.card:nth-child(1) .card-value');
    const casosActivosDescElement = document.querySelector('.card:nth-child(1) .card-description');
    const documentosElement = document.querySelector('.card:nth-child(3) .card-value');
    const documentosDescElement = document.querySelector('.card:nth-child(3) .card-description');

    // Función para formatear números (ej: 1000 -> 1,000)
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Función para obtener el token de las cookies
    function obtenerTokenDeCookie() {
        const cookieValue = document.cookie
            .split('; ')
            .find(fila => fila.startsWith('token='));
        
        if (cookieValue) {
            return cookieValue.split('=')[1];
        }
        return null;
    }

    // Función para actualizar estadísticas
    async function actualizarEstadisticas() {
        try {
            const token = obtenerTokenDeCookie();
            
            const response = await fetch('/abogado/api/estadisticas', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data) {
                // Actualizar casos activos
                const casosActivos = data.estadosProcesados.aceptado + data.estadosProcesados.iniciado;
                casosActivosElement.textContent = formatNumber(casosActivos);
                
                const nuevosCasos = data.estadosProcesados.aceptado;
                casosActivosDescElement.textContent = `${nuevosCasos} caso${nuevosCasos !== 1 ? 's' : ''} recientemente aceptado${nuevosCasos !== 1 ? 's' : ''}`;
                
                // Actualizar documentos (si está disponible en la API)
                if (data.totalDocumentos !== undefined) {
                    documentosElement.textContent = formatNumber(data.totalDocumentos);
                    
                    const nuevosDocumentos = data.nuevosDocumentos || 0;
                    if (nuevosDocumentos > 0) {
                        documentosDescElement.textContent = `${nuevosDocumentos} nuevo${nuevosDocumentos !== 1 ? 's' : ''} este mes`;
                    } else {
                        documentosDescElement.textContent = 'Total de documentos';
                    }
                }
            }
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
        }
    }

    // Función para actualizar la tabla de casos
    async function actualizarCasos() {
        try {
            const token = obtenerTokenDeCookie();
            
            const response = await fetch('/abogado/api/casos', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data && data.casos && data.casos.length) {
                const casosTable = document.querySelector('.section:first-of-type table tbody');
                
                // Limpiar tabla
                casosTable.innerHTML = '';
                
                // Mostrar solo los 3 primeros casos
                const casosRecientes = data.casos.slice(0, 3);
                
                casosRecientes.forEach(caso => {
                    // Determinar clase CSS para estado
                    let statusClass = '';
                    switch(caso.estado) {
                        case 'iniciado':
                        case 'aceptado':
                            statusClass = 'status-active';
                            break;
                        case 'enviado':
                            statusClass = 'status-pending';
                            break;
                        case 'finalizado':
                            statusClass = 'status-completed';
                            break;
                    }
                    
                    // Crear la fila con los datos del caso
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${caso.numeroExpediente}</td>
                        <td>${caso.clienteId ? caso.clienteId.nombre + ' ' + caso.clienteId.apellido : 'No asignado'}</td>
                        <td>${caso.tipo.charAt(0).toUpperCase() + caso.tipo.slice(1).replace('_', ' ')}</td>
                        <td>${new Date(caso.fechaRegistro).toLocaleDateString()}</td>
                        <td><span class="status ${statusClass}">${caso.estado.charAt(0).toUpperCase() + caso.estado.slice(1)}</span></td>
                    `;
                    
                    casosTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error al obtener casos:', error);
        }
    }

    // Inicializar datos
    actualizarEstadisticas();
    actualizarCasos();
    
    // Actualizar datos cada 5 minutos (opcional)
    setInterval(() => {
        actualizarEstadisticas();
        actualizarCasos();
    }, 5 * 60 * 1000);
    
    // Manejar click en "Ver todos" para casos
    document.querySelector('.section:first-of-type button').addEventListener('click', function() {
        window.location.href = '/abogado/casos';
    });
});
