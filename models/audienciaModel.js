// models/Audiencia.js
const mongoose = require("mongoose");

const audienciaSchema = new mongoose.Schema({
  fechaHora: Date,
  tipo: String,
  resultado: String,
  sala: { type: mongoose.Schema.Types.ObjectId, ref: "Sala" },
  caso: { type: mongoose.Schema.Types.ObjectId, ref: "Caso" },
});

module.exports = mongoose.model("Audiencia", audienciaSchema);
