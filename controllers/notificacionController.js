const Notificacion=require('../models/notificacionModel');

exports.listar=async (req,res)=>{
  const notifs=await Notificacion.find({usuarioId:req.user._id}).sort({fecha:-1}).lean();
  res.json(notifs);
};

exports.marcarLeida=async (req,res)=>{
  await Notificacion.findByIdAndUpdate(req.params.id,{leido:true});
  res.json({ok:true});
};
