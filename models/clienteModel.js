const Persona = require('./personaModel');
const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    tipo: String,
    documnetoIdentidad: String,
    fechaRegistro: { type: Date, default: Date.now },
});

module.exports = Persona.discriminator('cliente', clienteSchema);