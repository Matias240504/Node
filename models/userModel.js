const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  dni: String,
  email: { type: String, unique: true },
  telefono: String,
  direccion: String,
  usuario: { type: String, unique: true },
  contrasena: String,
  rol: { type: String, enum: ['cliente', 'juez', 'abogado'], default: 'cliente' },
  especialidad: String,          // solo para abogado y juez
  colegiatura: String,           // solo para abogado y juez
  estado: String,                // solo para abogado y juez
  documentoIdentidad: String,   // solo para cliente
  fechaRegistro: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
