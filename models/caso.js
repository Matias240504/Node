const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const archivoSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  ruta: {
    type: String,
    required: true,
  },
  tipo: {
    type: String,
    required: true,
  },
  fechaSubida: {
    type: Date,
    default: Date.now,
  },
});

const casoSchema = new Schema({
  numeroExpediente: {
    type: String,
    required: true,
    unique: true,
  },
  titulo: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  tipo: {
    type: String,
    required: true,
    enum: [
      "divorcio",
      "contrato_laboral",
      "propiedad_intelectual",
      "herencia",
      "inmobiliario",
      "inscripcion",
      "otro",
    ],
  },
  estado: {
    type: String,
    required: true,
    enum: ["enviado", "aceptado", "denegado", "iniciado", "finalizado"],
    default: "enviado",
  },
  prioridad: {
    type: String,
    enum: ["normal", "alta", "urgente"],
    default: "normal",
  },
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  abogadoId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  juezId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now,
  },
  archivos: [archivoSchema],
  comentarios: [
    {
      autor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      rol: {
        type: String,
        required: true,
      },
      texto: {
        type: String,
        required: true,
      },
      fecha: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Middleware pre-save para actualizar la fecha de actualización
casoSchema.pre("save", function (next) {
  this.fechaActualizacion = new Date();
  next();
});

// Índices para mejorar el rendimiento de las consultas
casoSchema.index({ clienteId: 1, fechaRegistro: -1 });
casoSchema.index({ estado: 1 });

module.exports = mongoose.model("Caso", casoSchema);
