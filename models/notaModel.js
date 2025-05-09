// models/Nota.js
const mongoose = require('mongoose');

const notaSchema = new mongoose.Schema({
  contenido: String,
  fechaCreacion: Date,
  esPrivada: Boolean,
  caso: { type: mongoose.Schema.Types.ObjectId, ref: 'Caso' }
});

module.exports = mongoose.model('Nota', notaSchema);
