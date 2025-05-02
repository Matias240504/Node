// models/clienteModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clienteSchema = new Schema({
    persona: { type: Schema.Types.ObjectId, ref: 'Persona' },
    tipo: String,
    documentoIdentidad: String,
    fechaRegistro: Date
});

module.exports = mongoose.model('Cliente', clienteSchema);