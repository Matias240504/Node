const Caso = require('../models/caso');

/**
 * Crea un nuevo caso en la base de datos
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.crearCaso = async (req, res) => {
    try {
        const { titulo, tipo, descripcion, prioridad } = req.body;
        const clienteId = req.user.id; // Obtenido del middleware de autenticación
        
        // Validaciones básicas
        if (!titulo || !tipo || !descripcion) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }
        
        // Generar número de expediente: C-AÑO-NÚMERO
        const año = new Date().getFullYear();
        
        // Contar casos existentes para este año para generar el número secuencial
        const casoCount = await Caso.countDocuments({
            numeroExpediente: { $regex: `C-${año}-` }
        });
        
        // Formatear el número secuencial con ceros a la izquierda (ej: 001, 010, 100)
        const numeroSecuencial = String(casoCount + 1).padStart(3, '0');
        const numeroExpediente = `C-${año}-${numeroSecuencial}`;
        
        // Capitalizar el título (primera letra de cada palabra en mayúscula)
        const tituloCapitalizado = titulo.replace(/\b\w/g, l => l.toUpperCase());
        
        // Crear el nuevo caso
        const nuevoCaso = new Caso({
            numeroExpediente,
            titulo: tituloCapitalizado,
            descripcion,
            tipo,
            prioridad: prioridad || 'normal',
            estado: 'enviado', // Estado por defecto
            clienteId,
            fechaRegistro: new Date()
        });
        
        // Guardar archivos adjuntos si existen
        if (req.files && req.files.length > 0) {
            // Aquí se procesarían los archivos adjuntos
            // Por ahora, solo guardamos los nombres de los archivos
            nuevoCaso.archivos = req.files.map(file => ({
                nombre: file.originalname,
                ruta: file.path,
                tipo: file.mimetype
            }));
        }
        
        // Guardar el caso en la base de datos
        await nuevoCaso.save();
        
        res.status(201).json({
            message: 'Caso creado exitosamente',
            numeroExpediente,
            caso: nuevoCaso
        });
    } catch (error) {
        console.error('Error al crear caso:', error);
        res.status(500).json({ message: 'Error al crear el caso', error: error.message });
    }
};

/**
 * Obtiene todos los casos de un cliente específico
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerCasosCliente = async (req, res) => {
    try {
        const clienteId = req.user.id; // Obtenido del middleware de autenticación
        
        const casos = await Caso.find({ clienteId })
            .sort({ fechaRegistro: -1 }) // Ordenar por fecha de registro (más reciente primero)
            .populate('abogadoId', 'nombre apellido') // Incluir información del abogado asignado
            .lean(); // Convertir a objeto plano para poder modificarlo
        
        // Procesar los casos para añadir el nombre completo del abogado
        const casosProcesados = casos.map(caso => {
            // Crear un objeto con los campos necesarios
            const casoFormateado = {
                _id: caso._id,
                numeroExpediente: caso.numeroExpediente,
                titulo: caso.titulo,
                tipo: caso.tipo,
                estado: caso.estado,
                fechaRegistro: caso.fechaRegistro,
                prioridad: caso.prioridad
            };
            
            // Añadir información del abogado si existe
            if (caso.abogadoId) {
                casoFormateado.abogadoNombre = `${caso.abogadoId.nombre} ${caso.abogadoId.apellido}`;
                casoFormateado.abogadoId = caso.abogadoId._id;
            }
            
            return casoFormateado;
        });
        
        res.status(200).json({ casos: casosProcesados });
    } catch (error) {
        console.error('Error al obtener casos:', error);
        res.status(500).json({ message: 'Error al obtener los casos', error: error.message });
    }
};

/**
 * Obtiene un caso específico por su ID
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerCasoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.user.id; // Obtenido del middleware de autenticación
        
        const caso = await Caso.findOne({ _id: id, clienteId });
        
        if (!caso) {
            return res.status(404).json({ message: 'Caso no encontrado' });
        }
        
        res.status(200).json({ caso });
    } catch (error) {
        console.error('Error al obtener caso:', error);
        res.status(500).json({ message: 'Error al obtener el caso', error: error.message });
    }
};

/**
 * Obtiene estadísticas de casos para el dashboard del cliente
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerEstadisticasCasos = async (req, res) => {
    try {
        const clienteId = req.user.id; // Obtenido del middleware de autenticación
        
        // Total de casos
        const totalCasos = await Caso.countDocuments({ clienteId });
        
        // Casos por estado
        const casosPorEstado = await Caso.aggregate([
            { $match: { clienteId: clienteId.toString() } },
            { $group: { _id: '$estado', count: { $sum: 1 } } }
        ]);
        
        // Casos recientes
        const casosRecientes = await Caso.find({ clienteId })
            .sort({ fechaRegistro: -1 })
            .limit(5)
            .select('numeroExpediente titulo tipo estado fechaRegistro');
        
        // Formatear estadísticas por estado para fácil consumo en el frontend
        const estadosProcesados = {
            enviado: 0,
            aceptado: 0,
            denegado: 0,
            iniciado: 0,
            finalizado: 0
        };
        
        casosPorEstado.forEach(item => {
            if (estadosProcesados.hasOwnProperty(item._id)) {
                estadosProcesados[item._id] = item.count;
            }
        });
        
        res.status(200).json({
            totalCasos,
            estadosProcesados,
            casosRecientes
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

/**
 * Obtiene todos los casos de un cliente con detalles completos y paginación
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerCasosClienteDetallados = async (req, res) => {
    try {
        const clienteId = req.user.id; // Obtenido del middleware de autenticación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Filtros base (siempre filtrar por clienteId)
        const filtros = { clienteId };
        
        // Filtro por estado
        if (req.query.estado && req.query.estado !== '') {
            filtros.estado = req.query.estado;
        }
        
        // Filtro por tipo
        if (req.query.tipo && req.query.tipo !== '') {
            filtros.tipo = req.query.tipo;
        }
        
        // Filtro por texto (búsqueda en título y número de expediente)
        if (req.query.busqueda && req.query.busqueda !== '') {
            const terminoBusqueda = req.query.busqueda;
            filtros.$or = [
                { numeroExpediente: { $regex: terminoBusqueda, $options: 'i' } },
                { titulo: { $regex: terminoBusqueda, $options: 'i' } }
            ];
        }
        
        // Filtro por fecha
        if (req.query.fechaDesde && req.query.fechaDesde !== '') {
            if (!filtros.fechaRegistro) filtros.fechaRegistro = {};
            filtros.fechaRegistro.$gte = new Date(req.query.fechaDesde);
        }
        
        if (req.query.fechaHasta && req.query.fechaHasta !== '') {
            if (!filtros.fechaRegistro) filtros.fechaRegistro = {};
            const fechaHasta = new Date(req.query.fechaHasta);
            fechaHasta.setHours(23, 59, 59, 999); // Fin del día
            filtros.fechaRegistro.$lte = fechaHasta;
        }
        
        // Consulta para obtener los casos filtrados con paginación
        const casos = await Caso.find(filtros)
            .sort({ fechaRegistro: -1 })
            .skip(skip)
            .limit(limit)
            .populate('abogadoId', 'nombre apellido')
            .populate('juezId', 'nombre apellido')
            .lean();
        
        // Contar el total de casos que coinciden con los filtros
        const totalCasos = await Caso.countDocuments(filtros);
        
        // Calcular información de paginación
        const totalPages = Math.ceil(totalCasos / limit);
        const hasPrevPage = page > 1;
        const hasNextPage = page < totalPages;
        
        res.status(200).json({
            casos,
            paginacion: {
                page,
                limit,
                totalCasos,
                totalPages,
                hasPrevPage,
                hasNextPage
            }
        });
    } catch (error) {
        console.error('Error al obtener casos detallados:', error);
        res.status(500).json({ 
            message: 'Error al obtener casos detallados', 
            error: error.message 
        });
    }
};
