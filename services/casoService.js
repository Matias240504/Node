const Caso = require('../models/casoModel');

class CasoService {
    async getAll() {
        const casos = await Caso.find({});
        return casos;
    }

    async getById(id) {
        const caso = await Caso.findById(id);
        return caso;
    }

    async create(data) {
        const nuevoCaso = new Caso(data);
        return await nuevoCaso.save();
    }
}

module.exports = CasoService;
