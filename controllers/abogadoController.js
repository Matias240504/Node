const User = require("../models/userModel");
const Caso = require("../models/caso");
const Audiencia = require("../models/audienciaModel");
const Sala = require("../models/salaModel");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Notificacion = require('../models/notificacionModel');

/**
 * Renderiza el dashboard del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderDashboard = async (req, res) => {
  try {
    const abogadoId = req.user.id;

    // Obtener casos asignados al abogado
    const casos = await Caso.find({ abogadoId })
      .sort({ fechaRegistro: -1 })
      .limit(5)
      .populate("clienteId", "nombre apellido email")
      .lean();

    // Asegurar que cada caso tenga las propiedades necesarias para evitar errores en la plantilla
    casos.forEach((caso) => {
      if (!caso.clienteId) {
        caso.clienteId = {
          nombre: "Cliente",
          apellido: "No asignado",
          email: "No disponible",
        };
      }
      // Asegurar que tipo y estado existan para evitar errores
      caso.tipo = caso.tipo || "civil";
      caso.estado = caso.estado || "pendiente";
      // Asegurar que fechaRegistro existe
      if (!caso.fechaRegistro) {
        caso.fechaRegistro = new Date();
      }
    });

    // Obtener audiencias próximas
    const hoy = new Date();
    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);

    const audiencias = await Audiencia.find({
      abogadoId,
      fecha: { $gte: hoy, $lte: proximoMes },
    })
      .sort({ fecha: 1 })
      .limit(5)
      .populate({
        path: "casoId",
        select: "titulo numeroExpediente clienteId",
        populate: {
          path: "clienteId",
          select: "nombre apellido",
        },
      })
      .lean();

    // Asegurar que cada audiencia tenga las propiedades necesarias para evitar errores en la plantilla
    audiencias.forEach((audiencia) => {
      if (!audiencia.casoId) {
        audiencia.casoId = {
          numeroExpediente: "No disponible",
          titulo: "No disponible",
        };
      }
      if (!audiencia.casoId.clienteId) {
        audiencia.casoId.clienteId = {
          nombre: "Cliente",
          apellido: "No asignado",
        };
      }
      // Formatear hora a partir de la fecha
      const fechaObj = new Date(audiencia.fecha);
      audiencia.hora =
        fechaObj.getHours().toString().padStart(2, "0") +
        ":" +
        fechaObj.getMinutes().toString().padStart(2, "0");
      // Asegurar que estado y tipo existan para evitar errores
      audiencia.estado = audiencia.estado || "pendiente";
      audiencia.tipo = audiencia.tipo || "otro";
    });

    // Obtener audiencias creadas por el abogado
    const audienciasCreadas = await Audiencia.find({ abogadoId })
      .sort({ fecha: -1 })
      .limit(5)
      .populate({
        path: "casoId",
        select: "numeroExpediente titulo clienteId",
        populate: {
          path: "clienteId",
          select: "nombre apellido",
        },
      })
      .lean();

    // Asegurar que cada audiencia tenga las propiedades necesarias para evitar errores en la plantilla
    audienciasCreadas.forEach((audiencia) => {
      if (!audiencia.casoId) {
        audiencia.casoId = { numeroExpediente: "No disponible" };
      }
      if (!audiencia.casoId.clienteId) {
        audiencia.casoId.clienteId = {
          nombre: "Cliente",
          apellido: "No asignado",
        };
      }
      // Asegurar que estado y tipo existan para evitar errores
      audiencia.estado = audiencia.estado || "pendiente";
      audiencia.tipo = audiencia.tipo || "otro";
    });

    // Contar casos por estado
    const casosPorEstado = await Caso.aggregate([
      { $match: { abogadoId: new mongoose.Types.ObjectId(abogadoId) } },
      { $group: { _id: "$estado", count: { $sum: 1 } } },
    ]);

    // Como no existe el modelo de Documento, establecemos un valor predeterminado
    const totalDocumentos = 0; // Valor por defecto hasta que se implemente el modelo de documentos

    // Formatear datos para el dashboard
    const estadisticas = {
      pendientes: 0,
      aceptados: 0,
      iniciados: 0,
      finalizados: 0,
      casosActivos: 0,
      totalDocumentos: totalDocumentos || 0,
      proximaAudiencia: "No hay audiencias programadas",
    };

    // Procesar casos por estado
    casosPorEstado.forEach((item) => {
      if (estadisticas.hasOwnProperty(item._id)) {
        estadisticas[item._id] = item.count;
      }
    });

    // Calcular casos activos (aceptados + iniciados)
    estadisticas.casosActivos = estadisticas.aceptados + estadisticas.iniciados;

    // Obtener la próxima audiencia si existe
    if (audiencias.length > 0) {
      const proximaAudiencia = audiencias[0];
      const fechaAudiencia = new Date(proximaAudiencia.fecha);
      estadisticas.proximaAudiencia = fechaAudiencia.toLocaleDateString();
    }

    res.render("abogado/dashboard", {
      user: req.user,
      title: "Dashboard",
      currentPath: "/abogado/dashboard",
      casos,
      audiencias,
      audienciasCreadas,
      estadisticas,
    });
  } catch (error) {
    console.error("Error al renderizar dashboard:", error);
    res.status(500).render("error", {
      message: "Error al cargar el dashboard",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

/**
 * Renderiza la lista de casos asignados al abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderCasos = async (req, res) => {
  try {
    res.render("abogado/casos", {
      user: req.user,
      title: "Mis Casos",
      currentPath: "/abogado/casos",
    });
  } catch (error) {
    console.error("Error al renderizar casos:", error);
    res.status(500).render("error", {
      message: "Error al cargar la página de casos",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

/**
 * Renderiza la lista de audiencias del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderAudiencias = async (req, res) => {
  try {
    res.render("abogado/audiencias", {
      user: req.user,
      title: "Mis Audiencias",
      currentPath: "/abogado/audiencias",
    });
  } catch (error) {
    console.error("Error al renderizar audiencias:", error);
    res.status(500).render("error", {
      message: "Error al cargar la página de audiencias",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

/**
 * Obtiene la lista de casos asignados al abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerCasosAbogado = async (req, res) => {
  try {
    const abogadoId = req.user.id;
    const { estado } = req.query;

    // Construir filtro
    const filtro = { abogadoId };
    if (estado && estado !== "todos") {
      filtro.estado = estado;
    }

    // Obtener casos con filtro
    const casos = await Caso.find(filtro)
      .sort({ fechaRegistro: -1 })
      .populate("clienteId", "nombre apellido email")
      .lean();

    // Formatear datos para la respuesta
    const casosProcesados = casos.map((caso) => ({
      _id: caso._id,
      numeroExpediente: caso.numeroExpediente,
      titulo: caso.titulo,
      tipo: caso.tipo,
      estado: caso.estado,
      fechaRegistro: caso.fechaRegistro,
      clienteNombre: caso.clienteId
        ? `${caso.clienteId.nombre} ${caso.clienteId.apellido}`
        : "Cliente no disponible",
      clienteEmail: caso.clienteId ? caso.clienteId.email : "",
      prioridad: caso.prioridad,
    }));

    res.status(200).json({ casos: casosProcesados });
  } catch (error) {
    console.error("Error al obtener casos:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los casos", error: error.message });
  }
};

/**
 * Obtiene la lista de audiencias del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerAudiencias = async (req, res) => {
  try {
    const abogadoId = req.user.id;
    const { periodo } = req.query;

    // Definir rango de fechas según el periodo
    const hoy = new Date();
    let fechaInicio = new Date(hoy);
    let fechaFin = new Date(hoy);

    switch (periodo) {
      case "semana":
        fechaFin.setDate(hoy.getDate() + 7);
        break;
      case "mes":
        fechaFin.setMonth(hoy.getMonth() + 1);
        break;
      case "trimestre":
        fechaFin.setMonth(hoy.getMonth() + 3);
        break;
      default:
        // Por defecto, próximos 30 días
        fechaFin.setDate(hoy.getDate() + 30);
    }

    // Obtener audiencias en el rango de fechas
    const audiencias = await Audiencia.find({
      abogadoId,
      fecha: { $gte: fechaInicio, $lte: fechaFin },
    })
      .sort({ fecha: 1 })
      .populate("casoId", "titulo numeroExpediente clienteId")
      .populate({
        path: "casoId",
        populate: { path: "clienteId", select: "nombre apellido email" },
      })
      .lean();

    // Formatear datos para la respuesta
    const audienciasProcesadas = audiencias.map((audiencia) => {
      const audienciaFormateada = {
        _id: audiencia._id,
        titulo: audiencia.titulo,
        descripcion: audiencia.descripcion,
        fecha: audiencia.fecha,
        hora: audiencia.hora,
        lugar: audiencia.lugar,
        tipo: audiencia.tipo,
        estado: audiencia.estado,
      };

      if (audiencia.casoId) {
        audienciaFormateada.caso = {
          _id: audiencia.casoId._id,
          titulo: audiencia.casoId.titulo,
          numeroExpediente: audiencia.casoId.numeroExpediente,
        };

        if (audiencia.casoId.clienteId) {
          audienciaFormateada.cliente = {
            nombre: `${audiencia.casoId.clienteId.nombre} ${audiencia.casoId.clienteId.apellido}`,
            email: audiencia.casoId.clienteId.email,
          };
        }
      }

      return audienciaFormateada;
    });

    res.status(200).json({ audiencias: audienciasProcesadas });
  } catch (error) {
    console.error("Error al obtener audiencias:", error);
    res.status(500).json({
      message: "Error al obtener las audiencias",
      error: error.message,
    });
  }
};

/**
 * Obtiene los detalles de un caso específico
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerDetalleCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const abogadoId = req.user.id;

    // Verificar que el id sea un ObjectId válido de MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "ID de caso inválido" });
    }

    // Buscar el caso y verificar que pertenezca al abogado
    const caso = await Caso.findOne({ _id: id, abogadoId })
      .populate("clienteId", "nombre apellido email telefono")
      .populate("abogadoId", "nombre apellido email telefono")
      .populate("comentarios.autor", "nombre apellido email rol")
      .lean();

    if (!caso) {
      return res.status(404).json({ message: "Caso no encontrado" });
    }

    // Formatear datos del caso para la respuesta
    const casoFormateado = {
      _id: caso._id,
      numeroExpediente: caso.numeroExpediente,
      titulo: caso.titulo,
      descripcion: caso.descripcion,
      tipo: caso.tipo,
      estado: caso.estado,
      fechaRegistro: caso.fechaRegistro,
      fechaActualizacion: caso.fechaActualizacion,
      prioridad: caso.prioridad,
      documentos: caso.documentos || [],
      comentarios: caso.comentarios.map((c) => ({
        _id: c._id,
        texto: c.texto,
        fecha: c.fecha,
        autor: {
          _id: c.autor._id,
          nombre: `${c.autor.nombre} ${c.autor.apellido}`,
          email: c.autor.email,
          rol: c.autor.rol,
        },
        visto: c.visto,
      })),
    };

    // Agregar información del cliente si existe
    if (caso.clienteId) {
      casoFormateado.cliente = {
        _id: caso.clienteId._id,
        nombre: `${caso.clienteId.nombre} ${caso.clienteId.apellido}`,
        email: caso.clienteId.email,
        telefono: caso.clienteId.telefono,
      };
    }

    // Agregar información del abogado si existe
    if (caso.abogadoId) {
      casoFormateado.abogado = {
        _id: caso.abogadoId._id,
        nombre: `${caso.abogadoId.nombre} ${caso.abogadoId.apellido}`,
        email: caso.abogadoId.email,
        telefono: caso.abogadoId.telefono,
      };
    }

    // Obtener audiencias relacionadas con el caso
    const audiencias = await Audiencia.find({ casoId: id })
      .sort({ fecha: 1 })
      .lean();

    casoFormateado.audiencias = audiencias.map((a) => ({
      _id: a._id,
      titulo: a.titulo,
      fecha: a.fecha,
      hora: a.hora,
      lugar: a.lugar,
      tipo: a.tipo,
      estado: a.estado,
    }));

    res.status(200).json(casoFormateado);
  } catch (error) {
    console.error("Error al obtener detalle del caso:", error);
    res.status(500).json({
      message: "Error al obtener los detalles del caso",
      error: error.message,
    });
  }
};

/**
 * Agrega un comentario a un caso
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.agregarComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto } = req.body;
    const abogadoId = req.user.id;

    // Validar entrada
    if (!texto || texto.trim() === "") {
      return res
        .status(400)
        .json({ message: "El comentario no puede estar vacío" });
    }

    // Buscar el caso
    const caso = await Caso.findById(id);

    if (!caso) {
      return res.status(404).json({ message: "Caso no encontrado" });
    }

    // Agregar comentario
    caso.comentarios.push({
      autor: abogadoId,
      rol: "abogado",
      texto,
      fecha: new Date(),
      visto: false,
    });

    // Guardar caso actualizado
    await caso.save();

    // Cargar el caso con los comentarios actualizados y populados
    const casoActualizado = await Caso.findById(id)
      .populate("comentarios.autor", "nombre apellido email")
      .exec();

    res.status(201).json({
      message: "Comentario agregado correctamente",
      comentario: caso.comentarios[caso.comentarios.length - 1],
      comentarios: casoActualizado.comentarios,
    });
  } catch (error) {
    console.error("Error al agregar comentario:", error);
    res
      .status(500)
      .json({ message: "Error al agregar comentario", error: error.message });
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
    const estadosPermitidos = [
      "aceptado",
      "denegado",
      "iniciado",
      "finalizado",
    ];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        message: "Estado no válido",
        estadosPermitidos,
      });
    }

    // Buscar el caso
    const caso = await Caso.findById(id);

    if (!caso) {
      return res.status(404).json({ message: "Caso no encontrado" });
    }

    // Si el estado cambia a 'aceptado' y no tiene abogado asignado, asignar al abogado actual
    if (estado === "aceptado" && !caso.abogadoId) {
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
      rol: "abogado",
      texto: `Estado del caso actualizado a "${estado}".`,
      fecha: new Date(),
      visto: false,
    });

    // Guardar caso actualizado
    await caso.save();

    // Cargar el caso con los comentarios actualizados y populados
    const casoActualizado = await Caso.findById(id)
      .populate("comentarios.autor", "nombre apellido email")
      .exec();

    res.status(200).json({
      message: "Estado del caso actualizado correctamente",
      caso: {
        _id: caso._id,
        estado: caso.estado,
        abogadoId: caso.abogadoId,
        comentarios: casoActualizado.comentarios,
      },
    });
  } catch (error) {
    console.error("Error al actualizar estado del caso:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar estado", error: error.message });
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
      return res.status(400).render("error", {
        message: "ID de caso inválido",
        error: {},
      });
    }

    res.render("abogado/detalle-caso", {
      user: req.user,
      title: "Detalle de Caso",
      currentPath: "/abogado/casos",
      casoId: id,
    });
  } catch (error) {
    console.error("Error al renderizar detalle del caso:", error);
    res.status(500).render("error", {
      message: "Error al cargar la página de detalle del caso",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

/**
 * Renderiza la vista de mis datos profesionales
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderMisDatos = async (req, res) => {
  try {
    // Obtener datos completos del abogado desde la base de datos
    const abogado = await User.findById(req.user.id);

    if (!abogado) {
      return res.status(404).render("error", {
        message: "Usuario no encontrado",
        error: {},
      });
    }

    res.render("abogado/mis-datos", {
      user: abogado,
      title: "Mis Datos Profesionales",
      currentPath: "/abogado/mis-datos",
    });
  } catch (error) {
    console.error("Error al renderizar mis datos:", error);
    res.status(500).render("error", {
      message: "Error al cargar la página de datos profesionales",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

/**
 * Actualiza los datos profesionales del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.actualizarDatosAbogado = async (req, res) => {
  try {
    const abogadoId = req.user.id;
    const {
      nombre,
      apellido,
      email,
      telefono,
      especialidad,
      colegiatura,
      biografia,
    } = req.body;

    // Validar los datos recibidos
    if (!nombre || !apellido || !email) {
      return res.status(400).json({
        message: "Los campos nombre, apellido y email son obligatorios",
      });
    }

    // Actualizar los datos del abogado
    const abogadoActualizado = await User.findByIdAndUpdate(
      abogadoId,
      {
        nombre,
        apellido,
        email,
        telefono,
        especialidad,
        colegiatura,
        biografia,
      },
      { new: true }
    ).select("-contrasena");

    if (!abogadoActualizado) {
      return res.status(404).json({ message: "Abogado no encontrado" });
    }

    res.status(200).json({
      message: "Datos actualizados correctamente",
      abogado: abogadoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar datos del abogado:", error);
    res.status(500).json({
      message: "Error al actualizar los datos profesionales",
      error: error.message,
    });
  }
};

/**
 * Obtiene los datos de un abogado específico por su ID
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerAbogadoPorId = async (req, res) => {
  try {
    const abogadoId = req.params.id;

    // Verificar que el ID sea válido
    if (!abogadoId || !abogadoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "ID de abogado inválido" });
    }

    // Buscar el abogado en la base de datos
    const abogado = await User.findOne({ _id: abogadoId, rol: "abogado" })
      .select("nombre apellido email telefono especialidad colegiatura")
      .lean();

    if (!abogado) {
      return res.status(404).json({ message: "Abogado no encontrado" });
    }

    // Devolver los datos del abogado
    res.status(200).json(abogado);
  } catch (error) {
    console.error("Error al obtener datos del abogado:", error);
    res.status(500).json({
      message: "Error al obtener los datos del abogado",
      error: error.message,
    });
  }
};

/**
 * Obtiene casos con paginación para el abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerCasosConPaginacion = async (req, res) => {
  try {
    const abogadoId = req.user.id;
    const { estado, pagina = 1, limite = 10 } = req.query;

    // Construir filtro
    const filtro = { abogadoId };
    if (estado && estado !== "todos") {
      filtro.estado = estado;
    }

    // Calcular skip para paginación
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    // Obtener total de casos para la paginación
    const total = await Caso.countDocuments(filtro);

    // Obtener casos paginados
    const casos = await Caso.find(filtro)
      .sort({ fechaRegistro: -1 })
      .skip(skip)
      .limit(parseInt(limite))
      .populate("clienteId", "nombre apellido email")
      .lean();

    res.status(200).json({
      casos,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        paginas: Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (error) {
    console.error("Error al obtener casos paginados:", error);
    res.status(500).json({
      message: "Error al obtener la lista de casos",
      error: error.message,
    });
  }
};

/**
 * Obtiene estadísticas del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerEstadisticasAbogado = async (req, res) => {
  try {
    const abogadoId = req.user.id;

    // Contar casos por estado
    const casosPorEstado = await Caso.aggregate([
      { $match: { abogadoId: new mongoose.Types.ObjectId(abogadoId) } },
      { $group: { _id: "$estado", count: { $sum: 1 } } },
    ]);

    // Contar audiencias por mes (últimos 6 meses)
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 5);
    fechaInicio.setDate(1);
    fechaInicio.setHours(0, 0, 0, 0);

    const audienciasPorMes = await Audiencia.aggregate([
      {
        $match: {
          abogadoId: new mongoose.Types.ObjectId(abogadoId),
          fecha: { $gte: fechaInicio },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$fecha" },
            month: { $month: "$fecha" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Formatear datos para estadísticas
    const estadisticas = {
      casosPorEstado: {
        pendientes: 0,
        aceptados: 0,
        iniciados: 0,
        finalizados: 0,
        rechazados: 0,
      },
      audienciasPorMes: [],
    };

    // Procesar casos por estado
    casosPorEstado.forEach((item) => {
      if (estadisticas.casosPorEstado.hasOwnProperty(item._id)) {
        estadisticas.casosPorEstado[item._id] = item.count;
      }
    });

    // Procesar audiencias por mes
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    // Inicializar últimos 6 meses
    const hoy = new Date();
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(hoy);
      fecha.setMonth(hoy.getMonth() - i);
      const year = fecha.getFullYear();
      const month = fecha.getMonth() + 1;

      estadisticas.audienciasPorMes.unshift({
        etiqueta: `${meses[month - 1]} ${year}`,
        valor: 0,
        year,
        month,
      });
    }

    // Actualizar con datos reales
    audienciasPorMes.forEach((item) => {
      const { year, month } = item._id;
      const audienciaItem = estadisticas.audienciasPorMes.find(
        (m) => m.year === year && m.month === month
      );

      if (audienciaItem) {
        audienciaItem.valor = item.count;
      }
    });

    res.status(200).json(estadisticas);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      message: "Error al obtener las estadísticas",
      error: error.message,
    });
  }
};

/**
 * Renderiza la vista para crear audiencia
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderCrearAudiencia = async (req, res) => {
  try {
    res.render("abogado/crearAudiencia", {
      user: req.user,
      title: "Crear Audiencia",
      currentPath: "/abogado/crearAudiencia",
    });
  } catch (error) {
    console.error("Error al renderizar crear audiencia:", error);
    res.status(500).render("error", {
      message: "Error al cargar la página de crear audiencia",
      error: process.env.NODE_ENV === "development" ? error : {},
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
    // Obtener todas las salas disponibles inicialmente
    const salas = await Sala.find({
      estado: { $ne: "mantenimiento" }, // Excluir salas en mantenimiento si aplica
    }).lean();

    // Registrar para debugging
    console.log("Total de salas encontradas:", salas.length);

    if (!salas || salas.length === 0) {
      return res.status(200).json({
        message: "No hay salas registradas en el sistema",
        salas: [],
      });
    }

    // Si se proporcionan fecha y hora, filtrar por disponibilidad
    if (req.query.fecha && req.query.hora) {
      const fechaAudiencia = new Date(req.query.fecha);
      const [horaInicio, minutosInicio] = req.query.hora.split(":").map(Number);
      fechaAudiencia.setHours(horaInicio, minutosInicio, 0, 0);

      // Calcular hora de fin (asumiendo 1 hora de duración)
      const fechaFin = new Date(fechaAudiencia);
      fechaFin.setHours(fechaAudiencia.getHours() + 1);

      // Buscar audiencias que se solapan con ese horario
      const audienciasExistentes = await Audiencia.find({
        fecha: fechaAudiencia,
        $or: [
          { hora_inicio: req.query.hora },
          {
            hora_inicio: {
              $gte: req.query.hora,
              $lt: `${fechaFin.getHours()}:${fechaFin.getMinutes()}`,
            },
          },
        ],
      }).select("salaId");

      // Filtrar salas ocupadas
      const salasOcupadas = audienciasExistentes.map((a) =>
        a.salaId.toString()
      );
      salas = salas.filter(
        (sala) => !salasOcupadas.includes(sala._id.toString())
      );
    }

    // Formatear respuesta
    const salasFormateadas = salas.map((sala) => ({
      _id: sala._id,
      numero: sala.numero_de_sala,
      capacidad: sala.capacidad,
      ubicacion: sala.ubicacion || "No especificada",
      nombre: `Sala ${sala.numero_de_sala} - Capacidad: ${sala.capacidad} personas`,
    }));

    res.status(200).json({
      message: "Salas obtenidas correctamente",
      salas: salasFormateadas,
    });
  } catch (error) {
    console.error("Error al obtener salas disponibles:", error);
    res.status(500).json({
      message: "Error al obtener las salas disponibles",
      error: error.message,
    });
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
      estado: "aceptado",
    })
      .sort({ fechaRegistro: -1 })
      .populate("clienteId", "nombre apellido")
      .select("numeroExpediente titulo tipo clienteId");

    res.status(200).json({ casos });
  } catch (error) {
    console.error("Error al obtener casos aceptados:", error);
    res.status(500).json({
      message: "Error al obtener casos aceptados",
      error: error.message,
    });
  }
};

/**
 * Crea una nueva audiencia
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.crearAudiencia = async (req, res) => {
  try {
    const { casoId, fecha, hora, salaId, tipo, descripcion } = req.body;
    const abogadoId = req.user.id;
    console.log("Iniciando creación de audiencia:", {
      casoId,
      fecha,
      hora,
      salaId,
      tipo,
      descripcion,
      abogadoId,
    });

    // Validar formato de los datos
    if (!mongoose.Types.ObjectId.isValid(casoId)) {
      return res.status(400).json({ message: "ID de caso inválido" });
    }
    if (!mongoose.Types.ObjectId.isValid(salaId)) {
      return res.status(400).json({ message: "ID de sala inválido" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res
        .status(400)
        .json({ message: "Formato de fecha inválido. Use YYYY-MM-DD" });
    }
    if (!/^\d{2}:\d{2}$/.test(hora)) {
      return res
        .status(400)
        .json({ message: "Formato de hora inválido. Use HH:mm" });
    }

    // Validar datos requeridos
    const camposFaltantes = [];
    if (!casoId) camposFaltantes.push("caso");
    if (!fecha) camposFaltantes.push("fecha");
    if (!hora) camposFaltantes.push("hora");
    if (!salaId) camposFaltantes.push("sala");
    if (!tipo) camposFaltantes.push("tipo");

    if (camposFaltantes.length > 0) {
      console.log("Validación fallida - campos faltantes:", camposFaltantes);
      return res.status(400).json({
        message: `Los siguientes campos son obligatorios: ${camposFaltantes.join(
          ", "
        )}`,
        received: { casoId, fecha, hora, salaId, tipo },
      });
    } // Verificar que el caso exista, pertenezca al abogado y esté en estado aceptado
    const caso = await Caso.findOne({
      _id: casoId,
      abogadoId,
      estado: "aceptado",
    });

    if (!caso) {
      console.error("Caso no válido:", { casoId, abogadoId });
      return res.status(404).json({
        message:
          "El caso debe existir, estar asignado al abogado y en estado 'aceptado'",
      });
    }

    // Verificar que la sala exista y esté disponible
    const sala = await Sala.findOne({
      _id: salaId,
      estado: { $ne: "mantenimiento" },
    });

    if (!sala) {
      console.error("Sala no válida:", { salaId });
      return res.status(404).json({
        message: "La sala debe existir y estar disponible para su uso",
      });
    } // Parsear y validar fecha y hora
    let fechaAudiencia;
    try {
      const [horas, minutos] = hora.split(":").map(Number);

      // Validar que la hora esté dentro del rango permitido (8:00 - 18:00)
      if (horas < 8 || horas >= 18) {
        console.error("Hora fuera de rango:", hora);
        return res.status(400).json({
          message:
            "Las audiencias solo pueden programarse entre las 8:00 y las 18:00",
        });
      }

      // Crear objeto Date con la fecha y hora
      fechaAudiencia = new Date(fecha);
      fechaAudiencia.setHours(horas, minutos, 0, 0);

      // Validar que la fecha y hora sean válidas
      if (isNaN(fechaAudiencia.getTime())) {
        console.error("Fecha/hora inválida:", { fecha, hora });
        return res.status(400).json({
          message: "La fecha u hora proporcionada no es válida",
        });
      }
    } catch (error) {
      console.error("Error al parsear fecha/hora:", error);
      return res.status(400).json({
        message: "Error al procesar la fecha u hora",
      });
    }

    // Validar que la fecha no sea anterior al día actual
    const ahora = new Date();
    if (fechaAudiencia < new Date(ahora.setHours(0, 0, 0, 0))) {
      console.error("Fecha en el pasado:", fechaAudiencia);
      return res.status(400).json({
        message: "No se pueden programar audiencias en fechas pasadas",
      });
    } // Verificar que no exista otra audiencia en la misma sala y hora
    const fechaInicio = new Date(fechaAudiencia);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(fechaAudiencia);
    fechaFin.setHours(23, 59, 59, 999);

    const audienciaExistente = await Audiencia.findOne({
      salaId,
      fecha: {
        $gte: fechaInicio,
        $lt: fechaFin,
      },
      hora: hora,
      estado: { $nin: ["cancelada", "completada"] },
    });

    if (audienciaExistente) {
      return res.status(400).json({
        message:
          "Ya existe una audiencia programada en esta sala para la fecha y hora seleccionada",
      });
    } // Crear la audiencia con todos los campos requeridos
    const nuevaAudiencia = new Audiencia({
      casoId,
      abogadoId,
      tipo,
      salaId,
      fecha: fechaAudiencia,
      hora,
      descripcion:
        descripcion || `Audiencia ${tipo} para caso ${caso.numeroExpediente}`,
      estado: "abierta",
      resultado: "pendiente",
    });

    // Validar el documento antes de guardar
    try {
      const validationError = nuevaAudiencia.validateSync();
      if (validationError) {
        console.error("Error de validación:", validationError);
        return res.status(400).json({
          message: "Error de validación en los datos de la audiencia",
          errors: Object.values(validationError.errors).map(
            (err) => err.message
          ),
        });
      }

      // Intentar guardar la audiencia
      await nuevaAudiencia.save();
      console.log("Audiencia guardada exitosamente:", {
        id: nuevaAudiencia._id,
        caso: nuevaAudiencia.casoId,
        fecha: nuevaAudiencia.fecha,
        hora: nuevaAudiencia.hora,
      });
    } catch (error) {
      console.error("Error al guardar la audiencia:", error);
      return res.status(500).json({
        message: "Error al guardar la audiencia en la base de datos",
        error: error.message,
      });
    }

    // Actualizar el caso con la referencia a la audiencia
    caso.audiencias = caso.audiencias || [];
    caso.audiencias.push(nuevaAudiencia._id);
    await caso.save();

    // Notificar al cliente dueño del caso
    if (caso.clienteId) {
      await Notificacion.create({
        usuarioId: caso.clienteId,
        tipo: "audiencia",
        titulo: `Nueva audiencia para el caso ${caso.titulo}`,
        mensaje: `Se programó una audiencia (${nuevaAudiencia.tipo}) el ${new Date(
          nuevaAudiencia.fecha
        ).toLocaleString()}`,
        datos: nuevaAudiencia.toObject(),
      });
    }

    res.status(201).json({
      message: "Audiencia creada exitosamente",
      audiencia: nuevaAudiencia,
    });
  } catch (error) {
    console.error("Error al crear audiencia:", error);
    res.status(500).json({
      message: "Error al crear la audiencia",
      error: error.message,
      details: error.stack,
    });
  }
};

/**
 * Agrega una nota a un caso
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.agregarNotaCaso = async (req, res) => {
  try {
    const casoId = req.params.id;
    const abogadoId = req.user.id;
    const { contenido } = req.body;

    // Validar contenido
    if (!contenido || contenido.trim() === "") {
      return res
        .status(400)
        .json({ message: "El contenido de la nota es obligatorio" });
    }

    // Verificar que el caso exista y pertenezca al abogado
    const caso = await Caso.findOne({ _id: casoId, abogadoId });
    if (!caso) {
      return res
        .status(404)
        .json({ message: "Caso no encontrado o no asignado a este abogado" });
    }

    // Crear la nota
    const nuevaNota = {
      autor: abogadoId,
      contenido,
      fecha: new Date(),
      tipo: "nota",
    };

    // Agregar la nota al caso
    caso.comentarios.push(nuevaNota);
    await caso.save();

    // Poblar el autor para devolver datos completos
    await caso.populate({
      path: "comentarios.autor",
      select: "nombre apellido rol",
    });

    res.status(201).json({
      message: "Nota agregada correctamente",
      nota: caso.comentarios[caso.comentarios.length - 1],
    });
  } catch (error) {
    console.error("Error al agregar nota:", error);
    res.status(500).json({
      message: "Error al agregar la nota al caso",
      error: error.message,
    });
  }
};

/**
 * Renderiza la vista de audiencias del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderAudiencias = async (req, res) => {
  try {
    const abogadoId = req.user.id;

    // Obtener audiencias del abogado
    const audiencias = await Audiencia.find({ abogadoId })
      .sort({ fecha: -1 })
      .populate({
        path: "casoId",
        select: "numeroExpediente titulo clienteId",
        populate: {
          path: "clienteId",
          select: "nombre apellido",
        },
      })
      .populate("salaId", "nombre ubicacion")
      .lean();

    res.render("abogado/audiencias", {
      user: req.user,
      title: "Mis Audiencias",
      currentPath: "/abogado/audiencias",
      audiencias,
    });
  } catch (error) {
    console.error("Error al renderizar audiencias:", error);
    res.status(500).render("error", {
      message: "Error al cargar las audiencias",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

/**
 * Obtiene las audiencias del abogado para la API
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerAudiencias = async (req, res) => {
  try {
    const abogadoId = req.user.id;
    const { estado, pagina = 1, limite = 10 } = req.query;

    // Construir filtro
    const filtro = { abogadoId };
    if (estado && estado !== "todas") {
      filtro.estado = estado;
    }

    // Calcular skip para paginación
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    // Obtener total de audiencias para la paginación
    const total = await Audiencia.countDocuments(filtro);

    // Obtener audiencias paginadas
    const audiencias = await Audiencia.find(filtro)
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(parseInt(limite))
      .populate({
        path: "casoId",
        select: "numeroExpediente titulo clienteId",
        populate: {
          path: "clienteId",
          select: "nombre apellido",
        },
      })
      .populate("salaId", "nombre ubicacion")
      .lean();

    res.status(200).json({
      audiencias,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        paginas: Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (error) {
    console.error("Error al obtener audiencias:", error);
    res.status(500).json({
      message: "Error al obtener las audiencias",
      error: error.message,
    });
  }
};

/**
 * Renderiza la vista de casos del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderCasos = async (req, res) => {
  try {
    const abogadoId = req.user.id;

    res.render("abogado/casos", {
      user: req.user,
      title: "Mis Casos",
      currentPath: "/abogado/casos",
    });
  } catch (error) {
    console.error("Error al renderizar casos:", error);
    res.status(500).render("error", {
      message: "Error al cargar los casos",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

/**
 * Renderiza la vista de detalle de un caso
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderDetalleCaso = async (req, res) => {
  try {
    const casoId = req.params.id;
    const abogadoId = req.user.id;

    // Verificar que el caso exista y pertenezca al abogado
    const caso = await Caso.findOne({ _id: casoId, abogadoId })
      .populate("clienteId", "nombre apellido email telefono")
      .populate("abogadoId", "nombre apellido email telefono")
      .populate("juezId", "nombre apellido")
      .populate({
        path: "comentarios.autor",
        select: "nombre apellido rol",
      })
      .lean();

    if (!caso) {
      return res.status(404).render("error", {
        message: "Caso no encontrado o no tienes permiso para verlo",
        error: {},
      });
    }

    // Obtener audiencias relacionadas con el caso
    const audiencias = await Audiencia.find({ casoId })
      .sort({ fecha: 1 })
      .populate("salaId", "nombre ubicacion")
      .lean();

    // Formatear audiencias para mostrar hora
    audiencias.forEach((audiencia) => {
      const fechaObj = new Date(audiencia.fecha);
      audiencia.hora =
        fechaObj.getHours().toString().padStart(2, "0") +
        ":" +
        fechaObj.getMinutes().toString().padStart(2, "0");
    });

    res.render("abogado/detalleCaso", {
      user: req.user,
      title: `Caso: ${caso.titulo}`,
      currentPath: "/abogado/casos",
      caso,
      audiencias,
    });
  } catch (error) {
    console.error("Error al renderizar detalle de caso:", error);
    res.status(500).render("error", {
      message: "Error al cargar el detalle del caso",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

/**
 * Obtiene los casos del abogado con paginación para la API
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerCasosConPaginacion = async (req, res) => {
  try {
    const abogadoId = req.user.id;
    const { estado, pagina = 1, limite = 10 } = req.query;

    // Construir filtro
    const filtro = { abogadoId };
    if (estado && estado !== "todos") {
      filtro.estado = estado;
    }

    // Calcular skip para paginación
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    // Obtener total de casos para la paginación
    const total = await Caso.countDocuments(filtro);

    // Obtener casos paginados
    const casos = await Caso.find(filtro)
      .sort({ fechaRegistro: -1 })
      .skip(skip)
      .limit(parseInt(limite))
      .populate("clienteId", "nombre apellido email")
      .lean();

    res.status(200).json({
      casos,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        paginas: Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (error) {
    console.error("Error al obtener casos con paginación:", error);
    res.status(500).json({
      message: "Error al obtener los casos",
      error: error.message,
    });
  }
};

/**
 * Obtiene los casos del abogado para el dashboard (sin paginación)
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerCasosAbogado = async (req, res) => {
  try {
    const abogadoId = req.user.id;

    const casos = await Caso.find({ abogadoId })
      .sort({ fechaRegistro: -1 })
      .populate("clienteId", "nombre apellido email")
      .lean();

    res.status(200).json(casos);
  } catch (error) {
    console.error("Error al obtener casos del abogado:", error);
    res.status(500).json({
      message: "Error al obtener los casos",
      error: error.message,
    });
  }
};

/**
 * Renderiza la vista de mis datos del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.renderMisDatos = async (req, res) => {
  try {
    res.render("abogado/mis-datos", {
      user: req.user,
      title: "Mis Datos Profesionales",
      currentPath: "/abogado/mis-datos",
    });
  } catch (error) {
    console.error("Error al renderizar mis datos:", error);
    res.status(500).render("error", {
      message: "Error al cargar la página de mis datos",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

/**
 * Actualiza los datos profesionales del abogado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.actualizarDatosAbogado = async (req, res) => {
  try {
    const abogadoId = req.user.id;
    const { especialidad, colegiatura, telefono, direccion } = req.body;

    // Validar datos
    if (!especialidad || !especialidad.trim()) {
      return res.status(400).json({ message: "La especialidad es requerida" });
    }

    if (!colegiatura || !colegiatura.trim() || !/^\d{10}$/.test(colegiatura)) {
      return res.status(400).json({
        message: "El número de colegiatura debe tener 10 dígitos numéricos",
      });
    }

    // Actualizar datos del abogado
    const datosActualizados = {
      especialidad: especialidad.trim(),
      colegiatura: colegiatura.trim(),
      estado: "activo", // Asegurar que el estado se mantenga como activo
    };

    // Agregar campos opcionales si están presentes
    if (telefono) datosActualizados.telefono = telefono.trim();
    if (direccion) datosActualizados.direccion = direccion.trim();

    // Actualizar en la base de datos
    const abogadoActualizado = await User.findByIdAndUpdate(
      abogadoId,
      datosActualizados,
      { new: true, runValidators: true }
    );

    if (!abogadoActualizado) {
      return res.status(404).json({ message: "Abogado no encontrado" });
    }

    res.status(200).json({
      message: "Datos actualizados correctamente",
      abogado: {
        nombre: abogadoActualizado.nombre,
        apellido: abogadoActualizado.apellido,
        email: abogadoActualizado.email,
        especialidad: abogadoActualizado.especialidad,
        colegiatura: abogadoActualizado.colegiatura,
        telefono: abogadoActualizado.telefono,
        direccion: abogadoActualizado.direccion,
        estado: abogadoActualizado.estado,
      },
    });
  } catch (error) {
    console.error("Error al actualizar datos del abogado:", error);
    res.status(500).json({
      message: "Error al actualizar los datos",
      error: error.message,
    });
  }
};

/**
 * Obtiene las audiencias del abogado con paginación para la API
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerAudiencias = async (req, res) => {
  try {
    const abogadoId = req.user.id;
    const { estado, tipo, desde, hasta, pagina = 1, limite = 10 } = req.query;

    // Construir filtro
    const filtro = { abogadoId };
    if (estado && estado !== "todos") {
      filtro.estado = estado;
    }
    if (tipo && tipo !== "todos") {
      filtro.tipo = tipo;
    }

    // Filtro por rango de fechas
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) {
        filtro.fecha.$gte = new Date(desde);
      }
      if (hasta) {
        filtro.fecha.$lte = new Date(hasta);
      }
    }

    // Calcular skip para paginación
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    // Obtener total de audiencias para la paginación
    const total = await Audiencia.countDocuments(filtro);

    // Obtener audiencias paginadas
    const audiencias = await Audiencia.find(filtro)
      .sort({ fecha: 1 })
      .skip(skip)
      .limit(parseInt(limite))
      .populate({
        path: "casoId",
        select: "numeroExpediente titulo clienteId",
        populate: {
          path: "clienteId",
          select: "nombre apellido",
        },
      })
      .populate("salaId", "nombre ubicacion")
      .lean();

    // Formatear fechas y horas para mejor visualización
    audiencias.forEach((audiencia) => {
      if (audiencia.fecha) {
        const fechaObj = new Date(audiencia.fecha);
        audiencia.fechaFormateada = fechaObj.toLocaleDateString();
        audiencia.hora =
          fechaObj.getHours().toString().padStart(2, "0") +
          ":" +
          fechaObj.getMinutes().toString().padStart(2, "0");
      }
    });

    res.status(200).json({
      audiencias,
      pagination: {
        total,
        page: parseInt(pagina),
        limit: parseInt(limite),
        totalPages: Math.ceil(total / parseInt(limite)),
        hasPrevPage: parseInt(pagina) > 1,
        hasNextPage: parseInt(pagina) < Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (error) {
    console.error("Error al obtener audiencias con paginación:", error);
    res.status(500).json({
      message: "Error al obtener las audiencias",
      error: error.message,
    });
  }
};
