const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const notificacionSchema=new Schema({
  usuarioId:{type:Schema.Types.ObjectId,ref:'User',required:true},
  tipo:{type:String,enum:['audiencia'],required:true},
  titulo:String,
  mensaje:String,
  datos:Object,
  leido:{type:Boolean,default:false},
  fecha:{type:Date,default:Date.now}
});

module.exports=mongoose.models.Notificacion||mongoose.model('Notificacion',notificacionSchema);
