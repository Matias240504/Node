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

// ================== NUEVAS FUNCIONES =====================

/** Renderiza el formulario para cambiar el rol de un usuario */
async function renderChangeRoleForm(req, res) {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).lean();
        if (!user) {
            return res.status(404).render('error', { message: 'Usuario no encontrado' });
        }
        const rolesPermitidos = ['cliente', 'abogado', 'juez', 'admin'];
        res.render('juez/cambiar-rol', { user: req.user, targetUser: user, rolesPermitidos });
    } catch (error) {
        console.error('Error al renderizar formulario de cambio de rol:', error);
        res.status(500).render('error', { message: 'Error interno' });
    }
}

/** Actualiza el rol de un usuario */
async function changeUserRole(req, res) {
    try {
        const userId = req.params.id;
        const { rol } = req.body;
        const rolesPermitidos = ['cliente', 'abogado', 'juez', 'admin'];
        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({ message: 'Rol no válido' });
        }
        const user = await User.findByIdAndUpdate(userId, { rol }, { new: true });
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        return res.json({ message: 'Rol actualizado', user });
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({ message: 'Error interno' });
    }
}

/** Renderiza página de selección de usuario para cambiar rol */
async function renderRoleSelector(req, res) {
    try {
        const usuarios = await User.find({}).select('nombre apellido email rol').lean();
        res.render('juez/seleccionar-rol', { user: req.user, usuarios });
    } catch (err) {
        console.error('Error renderRoleSelector:', err);
        res.status(500).render('error', { message: 'Error interno' });
    }
}

/** Devuelve usuarios paginados y filtrados (API) */
async function listUsers(req, res) {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '5');
    const rol = req.query.rol;
    const busqueda = req.query.busqueda;

    const filtro = {};
    if (rol) filtro.rol = rol;
    if (busqueda) {
      const regex = new RegExp(busqueda, 'i');
      filtro.$or = [{ nombre: regex }, { apellido: regex }, { email: regex }];
    }

    const totalUsuarios = await User.countDocuments(filtro);
    const usuarios = await User.find(filtro)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      usuarios,
      paginacion: {
        page,
        limit,
        totalUsuarios,
        totalPages: Math.ceil(totalUsuarios / limit),
        hasPrevPage: page > 1,
        hasNextPage: page * limit < totalUsuarios,
      },
    });
  } catch (err) {
    console.error('Error listUsers:', err);
    res.status(500).json({ message: 'Error interno' });
  }
}

module.exports = {
    renderDashboard,
    renderChangeRoleForm,
    changeUserRole,
    renderRoleSelector,
    listUsers
};
