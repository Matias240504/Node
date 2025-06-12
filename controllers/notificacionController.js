const Notificacion=require('../models/notificacionModel');
const Audiencia=require('../models/audienciaModel');

exports.listar=async (req,res)=>{
  try{
    let notifs=await Notificacion.find({usuarioId:req.user._id}).sort({fecha:-1}).lean();

    // Enriquecer datos para notificaciones de tipo 'audiencia'
    notifs=await Promise.all(notifs.map(async n=>{
      if(n.tipo==='audiencia'){
        // Si ya tiene la info necesaria salta
        const needsSala=!n.datos||!n.datos.sala;
        const needsAbogado=!n.datos||!n.datos.abogado;

        const audienciaId=n.datos?.audienciaId || n.datos?._id;
        if((needsSala||needsAbogado) && audienciaId){
          try{
            const audiencia=await Audiencia.findById(audienciaId)
              .populate('salaId','numero_de_sala nombre')
              .populate('abogadoId','nombre apellido')
              .lean();
            if(audiencia){
              n.datos=n.datos||{};
              if(needsSala && audiencia.salaId){
                n.datos.sala=audiencia.salaId.numero_de_sala || audiencia.salaId.nombre;
              }
              if(needsAbogado && audiencia.abogadoId){
                n.datos.abogado=`${audiencia.abogadoId.nombre} ${audiencia.abogadoId.apellido}`;
              }
            }
          }catch(err){
            console.error('Error enriqueciendo notificación:',err);
          }
        }
      }
      return n;
    }));

    res.json(notifs);
  }catch(error){
    console.error('Error al listar notificaciones:',error);
    res.status(500).json({message:'Error al obtener notificaciones',error:error.message});
  }
};

exports.marcarLeida=async (req,res)=>{
  await Notificacion.findByIdAndUpdate(req.params.id,{leido:true});
  res.json({ok:true});
};
