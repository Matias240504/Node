const mongoose = require('mongoose');

const casoSchema = new mongoose.Schema({
  numeroExpediente: String,
  titulo: String,
  descripcion: String,
  tipo: String,
  estado: String,
  fechaApertura: Date,
  fechaCierre: Date,
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  abogado: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  juez: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
});

module.exports = mongoose.model('Caso', casoSchema);
