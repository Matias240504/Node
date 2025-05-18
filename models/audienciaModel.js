const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const audienciaSchema = new Schema({
    casoId: {
        type: Schema.Types.ObjectId,
        ref: 'Caso',
        required: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['inicial', 'seguimiento', 'presentacion_pruebas', 'testimonio', 'alegatos', 'sentencia', 'otro']
    },
    descripcion: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    hora: {
        type: String,
        required: true
    },
    lugar: {
        type: String,
        required: true,
        default: 'Sala virtual'
    },
    estado: {
        type: String,
        required: true,
        enum: ['pendiente', 'aprobada', 'rechazada', 'completada', 'cancelada'],
        default: 'pendiente'
    },
    notas: {
        type: String
    },
    abogadoId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    juezId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    fechaModificacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware pre-save para actualizar la fecha de modificación
audienciaSchema.pre('save', function(next) {
    this.fechaModificacion = new Date();
    next();
});

// Índices para mejorar el rendimiento de las consultas
audienciaSchema.index({ casoId: 1 });
audienciaSchema.index({ fecha: 1 });
audienciaSchema.index({ abogadoId: 1 });
audienciaSchema.index({ juezId: 1 });
audienciaSchema.index({ estado: 1 });

// Usar una colección específica
const Audiencia = mongoose.models.Audiencia || mongoose.model('Audiencia', audienciaSchema);

module.exports = Audiencia;
