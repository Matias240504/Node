// models/casoModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const casoSchema = new Schema({
    numeroExpediente: String,
    titulo: String,
    descripcion: String,
    tipo: String,
    estado: String,
    fechaApertura: Date,
    fechaCierre: Date,
    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente' },
    abogado: { type: Schema.Types.ObjectId, ref: 'Abogado' }
});

module.exports = mongoose.model('Caso', casoSchema);
