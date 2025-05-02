const Abogado = require('../models/abogadoModel');

class AbogadoService {
    async getAll() {
        const abogados = await Abogado.find({});
        return abogados;
    }

    async getById(id) {
        const abogado = await Abogado.findById(id);
        return abogado;
    }

    async create(data) {
        const nuevoAbogado = new Abogado(data);
        return await nuevoAbogado.save();
    }
}

module.exports = AbogadoService;
