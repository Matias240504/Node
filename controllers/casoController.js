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
            .select('numeroExpediente titulo tipo estado fechaRegistro prioridad');
        
        res.status(200).json({ casos });
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
