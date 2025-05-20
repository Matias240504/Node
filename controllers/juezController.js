const Caso = require('../models/caso');
const User = require('../models/userModel');
const Audiencia = require('../models/audienciaModel');

/**
 * Renderiza el dashboard del juez/admin con datos globales y usuarios recientes
 */
async function renderDashboard(req, res) {
    try {
        // Estadísticas globales
        const usuariosTotales = await User.countDocuments();
        const casosActivos = await Caso.countDocuments({ estado: { $in: ['aceptado', 'iniciado'] } });
        const audienciasProximas = await Audiencia.countDocuments({ fecha: { $gte: new Date() } });
        // Reportes: puedes cambiar la lógica cuando implementes reportes reales
        const reportes = 0;

        // Usuarios recientes (últimos 5)
        let usuarios = await User.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Asegurar que todos los usuarios tengan un estado definido
        usuarios = usuarios.map(u => ({
            ...u,
            estado: u.estado || 'activo'
        }));

        // Casos recientes (últimos 5, para posible uso futuro)
        // const casosRecientes = await Caso.find({}).sort({ fechaCreacion: -1 }).limit(5);

        res.render('juez/dashboard', {
            user: req.user,
            usuarios,
            estadisticas: {
                usuariosTotales,
                casosActivos,
                audienciasProximas,
                reportes
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
