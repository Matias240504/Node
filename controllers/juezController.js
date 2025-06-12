const Caso = require('../models/caso');
const User = require('../models/userModel');
const Audiencia = require('../models/audienciaModel');
const Reporte = require('../models/reporteModel');

/**
 * Renderiza el dashboard del juez/admin con datos globales y usuarios recientes
 */
async function renderDashboard(req, res) {
    try {
        // Estadísticas globales
        const usuariosTotales = await User.countDocuments();
        const casosActivos = await Caso.countDocuments({ estado: { $in: ['aceptado', 'iniciado'] } });
        const audienciasProximas = await Audiencia.countDocuments({ fecha: { $gte: new Date() } });
        const reportes = await Reporte.countDocuments();

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

// ======================== REPORTES =====================
/** Renderiza la página de reportes */
function renderReportesPage(req, res) {
  const hoy = new Date();
  const defaultMonth = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  res.render('juez/reportes', { user: req.user, defaultMonth });
}

/** Utilidad para validar mes y rango */
function obtenerRangoMes(mesStr){
  if (!mesStr || !/\d{4}-\d{2}/.test(mesStr)) return null;
  const [anioStr, mStr] = mesStr.split('-');
  const inicio = new Date(parseInt(anioStr), parseInt(mStr) - 1, 1);
  const fin = new Date(parseInt(anioStr), parseInt(mStr), 1);
  return { inicio, fin };
}

/** Genera PDF con casos de un mes */
async function generarReporteCasos(req, res){
   try {
     const PDFDocument = require('pdfkit');
     const Caso = require('../models/caso');

     const { mes } = req.query;
     const rango = obtenerRangoMes(mes);
     if(!rango) return res.status(400).json({message:'mes inválido'});

     const casos = await Caso.find({ fechaRegistro: { $gte: rango.inicio, $lt: rango.fin } })
       .populate('clienteId', 'nombre apellido email')
       .populate('abogadoId', 'nombre apellido email')
       .populate('juezId', 'nombre apellido email')
       .lean();

     // Crear PDF
     const doc = new PDFDocument({ margin: 30, size: 'A4' });
     const filename = `reporte_casos_${mes}.pdf`;
     res.setHeader('Content-Type', 'application/pdf');
     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
     doc.pipe(res);

     doc.fontSize(18).text(`Reporte de Casos - ${mes}`, { align: 'center' });
     doc.moveDown();

     casos.forEach((c, idx) => {
       doc.fontSize(14).fillColor('#000').text(`${idx + 1}. ${c.titulo} (${c.numeroExpediente})`);
       doc.fontSize(11);
       doc.text(`Tipo: ${c.tipo} | Prioridad: ${c.prioridad} | Estado: ${c.estado}`);
       const cliente = c.clienteId ? `${c.clienteId.nombre} ${c.clienteId.apellido}` : 'N/A';
       const abogado = c.abogadoId ? `${c.abogadoId.nombre} ${c.abogadoId.apellido}` : 'N/A';
       const juez = c.juezId ? `${c.juezId.nombre} ${c.juezId.apellido}` : 'N/A';
       doc.text(`Cliente: ${cliente}`);
       doc.text(`Abogado: ${abogado}`);
       doc.text(`Juez: ${juez}`);
       doc.text(`Fecha de Registro: ${new Date(c.fechaRegistro).toLocaleDateString()}`);
       doc.moveDown(0.5);
       doc.text(`Descripción: ${c.descripcion}`);
       doc.moveDown();
       doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.options.margin, doc.y).stroke('#aaa');
       doc.moveDown();
     });

     if (casos.length === 0) {
       doc.fontSize(14).text('No hay casos registrados en este mes.', { align: 'center' });
     }

     doc.end();
     await Reporte.create({ nombreArchivo: filename, tipo: 'casos', mes, juezId: req.user._id });
   } catch (err) {
     console.error('Error generarReporteCasos:', err);
     res.status(500).json({ message: 'Error al generar reporte' });
   }
 }

/** Genera PDF con audiencias por mes */
async function generarReporteAudiencias(req,res){
  try{
     const PDFDocument=require('pdfkit');
     const Audiencia=require('../models/audienciaModel');
     const Caso=require('../models/caso');
     const {mes}=req.query;const rango=obtenerRangoMes(mes);
     if(!rango) return res.status(400).json({message:'mes inválido'});
     const audiencias=await Audiencia.find({fecha:{ $gte:rango.inicio,$lt:rango.fin }})
       .populate('casoId','titulo numeroExpediente')
       .populate('juezId','nombre apellido')
       .lean();
     const doc=new PDFDocument({margin:30,size:'A4'});
     const filename=`reporte_audiencias_${mes}.pdf`;
     res.setHeader('Content-Type','application/pdf');
     res.setHeader('Content-Disposition',`attachment; filename="${filename}"`);
     doc.pipe(res);
     doc.fontSize(18).text(`Reporte de Audiencias - ${mes}`,{align:'center'});doc.moveDown();
     audiencias.forEach((a,idx)=>{
        doc.fontSize(14).text(`${idx+1}. ${a.tipo} - ${a.casoId? a.casoId.titulo:'Sin caso'}`);
        doc.fontSize(11);
        doc.text(`Caso: ${a.casoId? a.casoId.numeroExpediente:''}`);
        doc.text(`Fecha: ${new Date(a.fecha).toLocaleDateString()} ${a.hora}`);
        doc.text(`Estado: ${a.estado} | Resultado: ${a.resultado}`);
        const juez=a.juezId? `${a.juezId.nombre} ${a.juezId.apellido}`:'N/A';
        doc.text(`Juez: ${juez}`);
        doc.text(`Descripción: ${a.descripcion}`);
        doc.moveDown(); doc.moveTo(doc.x, doc.y).lineTo(doc.page.width-doc.options.margin, doc.y).stroke('#aaa'); doc.moveDown();
     });
     if(audiencias.length===0) doc.fontSize(14).text('No hay audiencias en este mes',{align:'center'});
     doc.end();
     await Reporte.create({ nombreArchivo: filename, tipo: 'audiencias', mes, juezId: req.user._id });
  }catch(err){console.error('Error generarReporteAudiencias',err);res.status(500).json({message:'Error al generar reporte'});}
}

/** Genera PDF con usuarios nuevos por mes */
async function generarReporteUsuarios(req,res){
  try{
    const PDFDocument=require('pdfkit');
    const User=require('../models/userModel');
    const {mes}=req.query;const rango=obtenerRangoMes(mes);
    if(!rango) return res.status(400).json({message:'mes inválido'});
    const usuarios=await User.find({fechaRegistro:{ $gte:rango.inicio,$lt:rango.fin }})
      .lean();
    const doc=new PDFDocument({margin:30,size:'A4'});
    const filename=`reporte_usuarios_${mes}.pdf`;
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`attachment; filename="${filename}"`);
    doc.pipe(res);
    doc.fontSize(18).text(`Reporte de Usuarios Registrados - ${mes}`,{align:'center'});doc.moveDown();
    usuarios.forEach((u,idx)=>{
       doc.fontSize(12).text(`${idx+1}. ${u.nombre} ${u.apellido} (${u.email}) - Rol: ${u.rol} - Registro: ${new Date(u.fechaRegistro).toLocaleDateString()}`);
    });
    if(usuarios.length===0) doc.fontSize(14).text('No hay usuarios registrados en este mes',{align:'center'});
    doc.end();
    await Reporte.create({ nombreArchivo: filename, tipo: 'usuarios', mes, juezId: req.user._id });
  }catch(err){console.error('Error generarReporteUsuarios',err);res.status(500).json({message:'Error al generar reporte'});}
}

module.exports = {
    renderDashboard,
    renderChangeRoleForm,
    changeUserRole,
    renderRoleSelector,
    listUsers,
    renderReportesPage,
    generarReporteCasos,
    generarReporteAudiencias,
    generarReporteUsuarios
};
