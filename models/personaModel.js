const mongoose = require("mongoose");

const personaSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  dni: String,
  email: { type: String, unique: true },
  telefono: String,
  direccion: String,
  usuario: { type: String, unique: true },
  contrasena: String,
  rol: { type: String, enum: ["cliente", "abogado", "juez"], required: true },
  estado: String, // solo para abogado y juez
  especialidad: String, // abogado y juez
  colegiatura: String, // abogado y juez
  tipoDocumento: String, // solo cliente
  fechaRegistro: Date, // solo cliente
});

module.exports = mongoose.model("Persona", personaSchema);
