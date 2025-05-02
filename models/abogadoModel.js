// models/abogadoModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const abogadoSchema = new Schema({
    persona: { type: Schema.Types.ObjectId, ref: 'Persona' },
    especialidad: String,
    colegiatura: String,
    estado: String,
    rol: { type: Schema.Types.ObjectId, ref: 'Rol' }
});

module.exports = mongoose.model('Abogado', abogadoSchema);
