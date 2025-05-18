const Caso = require('../models/caso');
const User = require('../models/userModel');
const Audiencia = require('../models/audienciaModel');

/**
 * Renderiza el dashboard del juez con los datos necesarios
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function renderDashboard(req, res) {
    try {
        // Obtener casos asignados al juez
        const casos = await Caso.find({ juez: req.user._id })
            .populate('cliente', 'nombre apellido email')
            .populate('abogado', 'nombre apellido email')
            .sort({ fechaCreacion: -1 });
        
        // Estadísticas
        const casosActivos = casos.filter(caso => 
            caso.estado === 'aceptado' || caso.estado === 'iniciado'
        ).length;
        
        // Próximas audiencias
        const audiencias = await Audiencia.find({ 
            juez: req.user._id,
            fecha: { $gte: new Date() }
        })
        .populate('caso', 'titulo')
        .populate('sala', 'nombre')
        .sort({ fecha: 1 })
        .limit(5);
        
        // Audiencias creadas (todas las audiencias donde el juez participa)
        const audienciasCreadas = await Audiencia.find({ juez: req.user._id })
            .populate({
                path: 'caso',
                select: 'titulo numeroExpediente',
                populate: {
                    path: 'cliente',
                    select: 'nombre apellido'
                }
            })
            .populate('sala', 'nombre')
            .sort({ fecha: -1 })
            .limit(5);
        
        // Calcular próxima audiencia
        const proximaAudiencia = audiencias.length > 0 
            ? new Date(audiencias[0].fecha) 
            : new Date();
        
        // Total de documentos (simulado)
        const totalDocumentos = casos.reduce((total, caso) => 
            total + (caso.documentos ? caso.documentos.length : 0), 0);
        
        // Casos recientes (últimos 5)
        const casosRecientes = casos.slice(0, 5);

        // Renderizar la plantilla con los datos
        res.render('juez/dashboard', {
            user: req.user,
            casos: casosRecientes,
            audiencias,
            audienciasCreadas,
            estadisticas: {
                casosActivos,
                proximaAudiencia: proximaAudiencia.toLocaleDateString(),
                totalDocumentos
            }
        });
    } catch (error) {
        console.error('Error en el dashboard del juez:', error);
        res.status(500).render('error', { 
            message: 'Error al cargar el dashboard', 
            error 
        });
    }
}

module.exports = {
    renderDashboard
};
