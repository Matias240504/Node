// models/personaModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const personaSchema = new Schema({
    nombre: String,
    apellido: String,
    email: { type: String, unique: true },
    telefono: String,
    direccion: String,
    usuario: String,
    contrasena: String
});

module.exports = mongoose.model('Persona', personaSchema);