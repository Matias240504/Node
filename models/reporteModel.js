const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reporteSchema = new Schema({
  nombreArchivo: { type: String, required: true },
  tipo: { type: String, enum: ['casos', 'audiencias', 'usuarios'], required: true },
  mes: { type: String, required: true }, // formato YYYY-MM
  juezId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fechaGeneracion: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Reporte || mongoose.model('Reporte', reporteSchema);
