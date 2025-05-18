const Caso = require('../models/caso');
const User = require('../models/userModel');
const Audiencia = require('../models/audienciaModel');
const Sala = require('../models/salaModel');

/**
 * Renderiza el dashboard del abogado con los datos necesarios
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderDashboard = async (req, res) => {
    try {
        const abogadoId = req.user.id; // Obtenido del middleware de autenticación

        // Obtener todos los casos creados por clientes (no solo los asignados)
        const casos = await Caso.find()
            .sort({ fechaRegistro: -1 })
            .populate('clienteId', 'nombre apellido email')
            .populate('abogadoId', 'nombre apellido')
            .select('numeroExpediente tipo estado fechaRegistro clienteId abogadoId titulo');

        // Estadísticas de casos
        const casosActivos = await Caso.countDocuments({ 
            abogadoId, 
            estado: { $in: ['aceptado', 'iniciado'] } 
        });

        // Obtener audiencias pendientes del abogado
        const audiencias = await Audiencia.find({
            abogadoId,
            fecha: { $gte: new Date() },
            estado: { $in: ['pendiente', 'aprobada'] }
        })
        .sort({ fecha: 1, hora: 1 })
        .populate({
            path: 'casoId',
            select: 'numeroExpediente clienteId tipo titulo',
            populate: {
                path: 'clienteId',
                select: 'nombre apellido'
            }
        })
        .limit(3);
        
        // Obtener audiencias creadas por el abogado (todas)
        const audienciasCreadas = await Audiencia.find({
            abogadoId
        })
        .sort({ fechaCreacion: -1 })
        .populate({
            path: 'casoId',
            select: 'numeroExpediente clienteId tipo titulo',
            populate: {
                path: 'clienteId',
                select: 'nombre apellido'
            }
        })
        .limit(5);
        
        // Obtener la fecha de la próxima audiencia
        const proximaAudiencia = audiencias.length > 0 ? audiencias[0].fecha : new Date();

        // Contador de documentos (esto sería para una funcionalidad a implementar)
        // Por ahora usaremos un contador de archivos en los casos
        let totalDocumentos = 0;
        const casosConArchivos = await Caso.find({ abogadoId });
        casosConArchivos.forEach(caso => {
            if (caso.archivos && caso.archivos.length) {
                totalDocumentos += caso.archivos.length;
            }
        });
        
        // Casos recientes (últimos 5)
        const casosRecientes = casos.slice(0, 5);

        // Renderizar la plantilla con los datos
        res.render('abogado/dashboard', {
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
        console.error('Error en el dashboard del abogado:', error);
        res.status(500).render('error', { 
            message: 'Error al cargar el dashboard', 
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * Obtiene todos los casos para mostrar en el dashboard del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerCasosAbogado = async (req, res) => {
    try {
        // Obtener todos los casos ordenados por fecha
        const casos = await Caso.find()
            .sort({ fechaRegistro: -1 })
            .populate('clienteId', 'nombre apellido')
            .populate('abogadoId', 'nombre apellido')
            .select('numeroExpediente titulo tipo estado fechaRegistro clienteId abogadoId')
            .limit(5); // Limitar a 5 casos para el dashboard
        
        res.status(200).json({ casos });
    } catch (error) {
        console.error('Error al obtener casos:', error);
        res.status(500).json({ message: 'Error al obtener los casos', error: error.message });
    }
};

/**
 * Obtiene estadísticas de casos para el dashboard del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerEstadisticasAbogado = async (req, res) => {
    try {
        const abogadoId = req.user.id;
        
        // Total de casos asignados
        const totalCasos = await Caso.countDocuments({ abogadoId });
        
        // Casos por estado
        const casosPorEstado = await Caso.aggregate([
            { $match: { abogadoId: abogadoId.toString() } },
            { $group: { _id: '$estado', count: { $sum: 1 } } }
        ]);
        
        // Formatear estadísticas por estado
        const estadosProcesados = {
            enviado: 0,
            aceptado: 0,
            iniciado: 0,
            finalizado: 0
        };
        
        casosPorEstado.forEach(item => {
            if (estadosProcesados.hasOwnProperty(item._id)) {
                estadosProcesados[item._id] = item.count;
            }
        });
        
        // Contar documentos totales
        let totalDocumentos = 0;
        const casosConArchivos = await Caso.find({ abogadoId });
        casosConArchivos.forEach(caso => {
            if (caso.archivos && caso.archivos.length) {
                totalDocumentos += caso.archivos.length;
            }
        });
        
        // Obtener estadísticas de audiencias
        const totalAudiencias = await Audiencia.countDocuments({ abogadoId });
        const audienciasPendientes = await Audiencia.countDocuments({ 
            abogadoId, 
            estado: 'pendiente',
            fecha: { $gte: new Date() }
        });
        const audienciasAprobadas = await Audiencia.countDocuments({ 
            abogadoId, 
            estado: 'aprobada',
            fecha: { $gte: new Date() }
        });
        
        res.status(200).json({
            totalCasos,
            estadosProcesados,
            totalDocumentos,
            audiencias: {
                total: totalAudiencias,
                pendientes: audienciasPendientes,
                aprobadas: audienciasAprobadas
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas del abogado:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

/**
 * Obtiene audiencias para el abogado con paginación
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerAudiencias = async (req, res) => {
    try {
        const abogadoId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Filtros opcionales
        const filtros = { abogadoId };
        
        if (req.query.estado) {
            filtros.estado = req.query.estado;
        }
        
        if (req.query.desde) {
            filtros.fecha = { $gte: new Date(req.query.desde) };
        }
        
        if (req.query.hasta) {
            if (filtros.fecha) {
                filtros.fecha.$lte = new Date(req.query.hasta);
            } else {
                filtros.fecha = { $lte: new Date(req.query.hasta) };
            }
        }
        
        // Contar total de audiencias con los filtros aplicados
        const total = await Audiencia.countDocuments(filtros);
        
        // Obtener audiencias paginadas
        const audiencias = await Audiencia.find(filtros)
            .sort({ fecha: 1, hora: 1 })
            .populate({
                path: 'casoId',
                select: 'numeroExpediente clienteId tipo titulo',
                populate: {
                    path: 'clienteId',
                    select: 'nombre apellido'
                }
            })
            .populate('juezId', 'nombre apellido')
            .skip(skip)
            .limit(limit);
        
        // Calcular información de paginación
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        res.status(200).json({
            audiencias,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error('Error al obtener audiencias del abogado:', error);
        res.status(500).json({ message: 'Error al obtener audiencias', error: error.message });
    }
};

/**
 * Renderiza la vista de audiencias con paginación
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderAudiencias = async (req, res) => {
    try {
        res.render('abogado/audiencias', {
            user: req.user,
            title: 'Audiencias',
            currentPath: '/abogado/audiencias'
        });
    } catch (error) {
        console.error('Error al renderizar audiencias:', error);
        res.status(500).render('error', { 
            message: 'Error al cargar la página de audiencias', 
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * Renderiza la vista para crear una audiencia
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderCrearAudiencia = async (req, res) => {
    try {
        res.render('abogado/crearAudiencia', {
            user: req.user,
            title: 'Crear Audiencia',
            currentPath: '/abogado/crearAudiencia'
        });
    } catch (error) {
        console.error('Error al renderizar la vista de crear audiencia:', error);
        res.status(500).render('error', { 
            message: 'Error al cargar la página de crear audiencia', 
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * Obtiene las salas disponibles para audiencias
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerSalasDisponibles = async (req, res) => {
    try {
        const salas = await Sala.find({ disponibilidad: true })
            .sort({ numero_de_sala: 1 });
        
        res.status(200).json({ salas });
    } catch (error) {
        console.error('Error al obtener salas disponibles:', error);
        res.status(500).json({ message: 'Error al obtener salas disponibles', error: error.message });
    }
};

/**
 * Obtiene los casos aceptados para crear audiencias
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerCasosAceptados = async (req, res) => {
    try {
        const abogadoId = req.user.id;
        
        const casos = await Caso.find({ 
            abogadoId, 
            estado: 'aceptado' 
        })
        .sort({ fechaRegistro: -1 })
        .populate('clienteId', 'nombre apellido')
        .select('numeroExpediente titulo tipo clienteId');
        
        res.status(200).json({ casos });
    } catch (error) {
        console.error('Error al obtener casos aceptados:', error);
        res.status(500).json({ message: 'Error al obtener casos aceptados', error: error.message });
    }
};

/**
 * Crea una nueva audiencia y actualiza la disponibilidad de la sala
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.crearAudiencia = async (req, res) => {
    try {
        const { casoId, salaId, tipo, descripcion, fecha, hora } = req.body;
        const abogadoId = req.user.id;
        
        // Verificar que el caso exista y esté aceptado
        const caso = await Caso.findOne({ _id: casoId, estado: 'aceptado' });
        if (!caso) {
            return res.status(400).json({ message: 'El caso seleccionado no existe o no está aceptado' });
        }
        
        // Verificar que la sala exista y esté disponible
        const sala = await Sala.findOne({ _id: salaId, disponibilidad: true });
        if (!sala) {
            return res.status(400).json({ message: 'La sala seleccionada no existe o no está disponible' });
        }
        
        // Crear la audiencia
        const nuevaAudiencia = new Audiencia({
            casoId,
            salaId,
            tipo,
            descripcion,
            fecha,
            hora,
            abogadoId
        });
        
        await nuevaAudiencia.save();
        
        // Actualizar la disponibilidad de la sala a false
        sala.disponibilidad = false;
        await sala.save();
        
        res.status(201).json({ 
            message: 'Audiencia creada exitosamente', 
            audiencia: nuevaAudiencia 
        });
    } catch (error) {
        console.error('Error al crear audiencia:', error);
        res.status(500).json({ message: 'Error al crear audiencia', error: error.message });
    }
};

/**
 * Actualiza el estado de una audiencia y la disponibilidad de la sala
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.actualizarEstadoAudiencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, resultado } = req.body;
        
        // Verificar que la audiencia exista
        const audiencia = await Audiencia.findById(id);
        if (!audiencia) {
            return res.status(404).json({ message: 'Audiencia no encontrada' });
        }
        
        // Si la audiencia se marca como completada o cancelada, liberar la sala
        if (estado === 'completada' || estado === 'cancelada') {
            const sala = await Sala.findById(audiencia.salaId);
            if (sala) {
                sala.disponibilidad = true;
                await sala.save();
            }
        }
        
        // Actualizar la audiencia
        audiencia.estado = estado;
        if (resultado) {
            audiencia.resultado = resultado;
        }
        
        await audiencia.save();
        
        res.status(200).json({ 
            message: 'Estado de audiencia actualizado exitosamente', 
            audiencia 
        });
    } catch (error) {
        console.error('Error al actualizar estado de audiencia:', error);
        res.status(500).json({ message: 'Error al actualizar estado de audiencia', error: error.message });
    }
};

/**
 * Obtiene casos con paginación para la vista de casos
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerCasosConPaginacion = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Filtros opcionales
        const filtros = {};
        
        if (req.query.estado) {
            filtros.estado = req.query.estado;
        }
        
        if (req.query.tipo) {
            filtros.tipo = req.query.tipo;
        }
        
        // Filtro opcional por abogado asignado
        if (req.query.asignado === 'si') {
            filtros.abogadoId = { $exists: true, $ne: null };
        } else if (req.query.asignado === 'no') {
            filtros.abogadoId = { $exists: false };
        }
        
        // Busqueda por texto
        if (req.query.busqueda) {
            const termino = req.query.busqueda;
            filtros.$or = [
                { numeroExpediente: { $regex: termino, $options: 'i' } },
                { titulo: { $regex: termino, $options: 'i' } }
            ];
        }
        
        // Contar total de casos con los filtros aplicados
        const total = await Caso.countDocuments(filtros);
        
        // Obtener casos paginados
        const casos = await Caso.find(filtros)
            .sort({ fechaRegistro: -1 })
            .populate('clienteId', 'nombre apellido')
            .populate('abogadoId', 'nombre apellido')
            .skip(skip)
            .limit(limit);
        
        // Calcular información de paginación
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        res.status(200).json({
            casos,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error('Error al obtener casos paginados:', error);
        res.status(500).json({ message: 'Error al obtener los casos', error: error.message });
    }
};

/**
 * Renderiza la vista de casos con paginación
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderCasos = async (req, res) => {
    try {
        res.render('abogado/casos', {
            user: req.user,
            title: 'Casos',
            currentPath: '/abogado/casos'
        });
    } catch (error) {
        console.error('Error al renderizar casos:', error);
        res.status(500).render('error', { 
            message: 'Error al cargar la página de casos', 
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * Obtiene detalles de un caso específico
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerDetalleCaso = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el id sea un ObjectId válido de MongoDB
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'ID de caso inválido' });
        }
        
        // Obtener caso completo con todas las relaciones
        const caso = await Caso.findById(id)
            .populate('clienteId', 'nombre apellido email telefono')
            .populate('abogadoId', 'nombre apellido email')
            .populate('juezId', 'nombre apellido')
            .populate({
                path: 'comentarios.autor',
                select: 'nombre apellido rol'
            });
            
        if (!caso) {
            return res.status(404).json({ message: 'Caso no encontrado' });
        }
        
        res.status(200).json({ caso });
        
    } catch (error) {
        console.error('Error al obtener detalle del caso:', error);
        res.status(500).json({ message: 'Error al obtener detalles del caso', error: error.message });
    }
};

/**
 * Añadir un comentario o nota al caso
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.agregarNotaCaso = async (req, res) => {
    try {
        const { id } = req.params;
        const { texto } = req.body;
        const abogadoId = req.user.id;
        
        if (!texto || texto.trim() === '') {
            return res.status(400).json({ message: 'El texto del comentario es requerido' });
        }
        
        // Buscar el caso
        const caso = await Caso.findById(id);
        
        if (!caso) {
            return res.status(404).json({ message: 'Caso no encontrado' });
        }
        
        // Registrar quién agregó la nota
        caso.ultimaActualizacionPor = abogadoId;
        caso.fechaActualizacion = new Date();
        
        // Agregar comentario con campo de visto
        caso.comentarios.push({
            autor: abogadoId,
            rol: 'abogado',
            texto,
            fecha: new Date(),
            visto: false
        });
        
        // Guardar caso actualizado
        await caso.save();
        
        // Cargar el caso con los comentarios actualizados y populados
        const casoActualizado = await Caso.findById(id)
            .populate('comentarios.autor', 'nombre apellido email')
            .exec();
            
        res.status(201).json({
            message: 'Comentario agregado correctamente',
            comentario: caso.comentarios[caso.comentarios.length - 1],
            comentarios: casoActualizado.comentarios
        });
        
    } catch (error) {
        console.error('Error al agregar comentario:', error);
        res.status(500).json({ message: 'Error al agregar comentario', error: error.message });
    }
};

/**
 * Actualizar el estado de un caso
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.actualizarEstadoCaso = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const abogadoId = req.user.id;
        
        // Validar que el estado sea uno de los permitidos
        const estadosPermitidos = ['aceptado', 'denegado', 'iniciado', 'finalizado'];
        
        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({ 
                message: 'Estado no válido', 
                estadosPermitidos 
            });
        }
        
        // Buscar el caso
        const caso = await Caso.findById(id);
        
        if (!caso) {
            return res.status(404).json({ message: 'Caso no encontrado' });
        }
        
        // Si el estado cambia a 'aceptado' y no tiene abogado asignado, asignar al abogado actual
        if (estado === 'aceptado' && !caso.abogadoId) {
            caso.abogadoId = abogadoId;
        }
        
        // Actualizar estado
        caso.estado = estado;
        
        // Registrar quién actualizó el estado
        caso.ultimaActualizacionPor = abogadoId;
        caso.fechaActualizacion = new Date();
        
        // Agregar comentario automático con campo de visto
        caso.comentarios.push({
            autor: abogadoId,
            rol: 'abogado',
            texto: `Estado del caso actualizado a "${estado}".`,
            fecha: new Date(),
            visto: false
        });
        
        // Guardar caso actualizado
        await caso.save();
        
        // Cargar el caso con los comentarios actualizados y populados
        const casoActualizado = await Caso.findById(id)
            .populate('comentarios.autor', 'nombre apellido email')
            .exec();
            
        res.status(200).json({
            message: 'Estado del caso actualizado correctamente',
            caso: {
                _id: caso._id,
                estado: caso.estado,
                abogadoId: caso.abogadoId,
                comentarios: casoActualizado.comentarios
            }
        });
        
    } catch (error) {
        console.error('Error al actualizar estado del caso:', error);
        res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
    }
};

/**
 * Renderiza la vista de detalle de un caso
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderDetalleCaso = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el id sea un ObjectId válido de MongoDB
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).render('error', { 
                message: 'ID de caso inválido',
                error: {}
            });
        }
        
        res.render('abogado/detalle-caso', {
            user: req.user,
            title: 'Detalle de Caso',
            currentPath: '/abogado/casos',
            casoId: id
        });
    } catch (error) {
        console.error('Error al renderizar detalle del caso:', error);
        res.status(500).render('error', { 
            message: 'Error al cargar la página de detalle del caso', 
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};
