const { escapeXML } = require('ejs');
const Persona = require('./personaModel');
const mongoose = require('mongoose');

const juezSchema = new mongoose.Schema({
    especialidad: String,
    colegiatura: String,
    estado: { type: String, default: 'activo' },
});

module.exports = Persona.discriminator('juez', juezSchema);