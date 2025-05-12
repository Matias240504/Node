const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  dni: String,
  email: { type: String, unique: true },
  telefono: String,
  direccion: String,
  usuario: { type: String, unique: true },
  contrasena: String,
  rol: { type: String, enum: ['cliente', 'juez', 'abogado'], required: true }
}, {
  discriminatorKey: 'rol',
  timestamps: true
});

module.exports = mongoose.model('Persona', personaSchema);