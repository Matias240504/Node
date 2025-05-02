const Persona = require('../models/personaModel');

class PersonaService {
    constructor() {}

    async getAll() {
        const personas = await Persona.find({});
        return personas;
    }

    async getById(id) {
        const persona = await Persona.findById(id);
        return persona;
    }

    async create(data) {
        const persona = new Persona(data);
        try {
            const result = await persona.save();
            return { status: true, data: result };
        } catch (error) {
            return { status: false, error: error.message };
        }
    }
}

module.exports = PersonaService;
