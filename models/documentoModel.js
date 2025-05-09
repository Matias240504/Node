// models/Documento.js
const mongoose = require('mongoose');

const documentoSchema = new mongoose.Schema({
  nombre: String,
  tipo: String,
  urlArchivo: String,
  fechaSubido: Date,
  caso: { type: mongoose.Schema.Types.ObjectId, ref: 'Caso' }
});

module.exports = mongoose.model('Documento', documentoSchema);
