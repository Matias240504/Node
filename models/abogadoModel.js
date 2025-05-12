const Persona = require('./personaModel');
const mongoose = require('mongoose');

const abogadoSchema = new mongoose.Schema({
    especialidad: String,
    colegiatura: String,
    estado: { type: String, default: 'activo' },
});

module.exports = Persona.discriminator('abogado', abogadoSchema);