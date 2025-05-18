const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const salaSchema = new Schema({
    numero_de_sala: {
        type: String,
        required: true,
        unique: true
    },
    disponibilidad: {
        type: Boolean,
        required: true,
        default: true
    },
    capacidad: {
        type: Number,
        required: true,
        default: 20
    },
    ubicacion: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Middleware para formatear el número de sala antes de guardar
salaSchema.pre('save', function(next) {
    // Asegurarse de que el formato sea correcto (no es necesario si ya viene formateado)
    if (!this.numero_de_sala.includes('-')) {
        const piso = this.numero_de_sala.substring(0, 1);
        const sala = this.numero_de_sala.substring(1, 3);
        const edificio = this.numero_de_sala.substring(3);
        this.numero_de_sala = `${piso}${sala}-${edificio}`;
    }
    next();
});

module.exports = mongoose.model('Sala', salaSchema);
